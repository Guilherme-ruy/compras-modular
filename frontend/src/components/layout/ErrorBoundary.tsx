import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Ops! Algo deu errado.</h1>
            <p className="text-slate-500 max-w-md mb-6">
                Ocorreu um erro inesperado na tela que está tentando acessar. Verifique sua conexão com a API ou contate o suporte.
            </p>
            {this.state.errorMsg && (
                <div className="bg-red-50 text-red-800 p-4 rounded-md text-sm font-mono max-w-2xl w-full mx-auto text-left overflow-auto">
                    {this.state.errorMsg}
                </div>
            )}
            <button 
                className="mt-6 px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700"
                onClick={() => window.location.href = '/app'}
            >
                Voltar para o Início
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}
