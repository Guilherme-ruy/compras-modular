import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { SuppliersRepository } from './suppliers.repository';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED'];

@Injectable()
export class SuppliersService {
  constructor(private readonly suppliersRepository: SuppliersRepository) {}

  findAll(query: {
    search?: string;
    status?: string;
    page?: number;
    perPage?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    return this.suppliersRepository.findAll({
      search: query.search,
      status: query.status,
      page: query.page ?? 1,
      perPage: query.perPage ?? 20,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  async findById(id: string) {
    const supplier = await this.suppliersRepository.findById(id);
    if (!supplier) throw new NotFoundException('Fornecedor não encontrado');
    return supplier;
  }

  create(dto: CreateSupplierDto) {
    return this.suppliersRepository.create({
      companyName: dto.companyName,
      tradeName: dto.tradeName ?? '',
      cnpj: dto.cnpj,
      stateReg: dto.stateReg ?? '',
      contactName: dto.contactName ?? '',
      phone: dto.phone ?? '',
      email: dto.email ?? '',
      comContact: dto.comContact ?? '',
      finContact: dto.finContact ?? '',
      zipCode: dto.zipCode ?? '',
      street: dto.street ?? '',
      number: dto.number ?? '',
      neighborhood: dto.neighborhood ?? '',
      city: dto.city ?? '',
      state: dto.state ?? '',
      bank: dto.bank ?? '',
      agency: dto.agency ?? '',
      account: dto.account ?? '',
      pix: dto.pix ?? '',
      notes: dto.notes ?? '',
      attachments: dto.attachments ?? [],
    });
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findById(id);
    return this.suppliersRepository.update(id, { ...dto });
  }

  async updateStatus(id: string, status: string) {
    if (!VALID_STATUSES.includes(status)) {
      throw new BadRequestException(`Status inválido. Use: ${VALID_STATUSES.join(', ')}`);
    }
    await this.findById(id);
    return this.suppliersRepository.updateStatus(id, status);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.suppliersRepository.softDelete(id);
  }
}
