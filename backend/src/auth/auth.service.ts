import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  roleName: string;
  roleId: string;
  tenantId: string;
  departments: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    if (!email || !password) {
      throw new BadRequestException('Email e senha são obrigatórios');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        role: true,
        userDepartments: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roleName: user.role.name,
      roleId: user.roleId,
      tenantId: user.tenantId,
      departments: user.userDepartments.map(ud => ud.departmentId),
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
      },
      permissions: {},
    };
  }

  async signUp(companyName: string, email: string, phone: string, password: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      throw new BadRequestException('Email já está em uso.');
    }

    let tenantAdminRole = await this.prisma.role.findUnique({ where: { name: 'TENANT_ADMIN' } });
    if (!tenantAdminRole) {
      tenantAdminRole = await this.prisma.role.create({
        data: { name: 'TENANT_ADMIN', permissions: {} }
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: companyName,
        subscriptionStatus: 'trialing',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        settings: {
          create: {
            companyName,
          }
        },
        users: {
          create: {
            name: 'Administrador',
            email: email.toLowerCase().trim(),
            phone,
            passwordHash,
            roleId: tenantAdminRole.id,
            isActive: true,
          }
        }
      },
      include: {
        users: true
      }
    });

    const user = tenant.users[0];

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roleName: tenantAdminRole.name,
      roleId: tenantAdminRole.id,
      tenantId: tenant.id,
      departments: [],
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: tenantAdminRole.name,
        tenantId: tenant.id,
      },
      message: 'Conta criada com sucesso.'
    };
  }

  // ─────────────────────────────────────────────────────────
  //  FLUXO 1: Esqueci minha senha (sem autenticação)
  // ─────────────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    // Sempre retorna 200 — nunca revela se o email existe (evita enumeração)
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) return;

    // Invalida tokens anteriores deste usuário
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Gera token seguro: envia em claro, armazena SHA-256
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    // Em dev: loga o link no console. Em prod: integrar SMTP aqui.
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    console.log(`\n🔐 [PASSWORD RESET] Link para ${user.email}:\n   ${resetLink}\n`);

    // TODO (Iniciativa 2 - Email): enviar email com resetLink usando @nestjs-modules/mailer
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    if (record.usedAt) {
      throw new BadRequestException('Este link já foi utilizado');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException('Token expirado. Solicite um novo link');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  // ─────────────────────────────────────────────────────────
  //  FLUXO 2: Trocar senha (autenticado)
  // ─────────────────────────────────────────────────────────

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      throw new BadRequestException('Senha atual incorreta');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('A nova senha deve ser diferente da atual');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
