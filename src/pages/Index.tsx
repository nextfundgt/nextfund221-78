import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { TrendingUp, TrendingDown, ArrowUpDown, Settings, RotateCcw, Shield, ShieldCheck, Key, Lock, Mic, ChevronDown, ChevronRight, BarChart3, Menu, Twitter, MessageCircle, Users, DollarSign, Calendar } from "lucide-react";
import SimulatorCard from "../components/SimulatorCard";
import nextfundLogo from "../assets/nextfund-logo-new.png";
export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartEarning = () => {
    if (user) {
      console.log('Usuário logado, navegando para /home');
      navigate('/home');
    } else {
      console.log('Usuário não logado, navegando para /cadastro');
      navigate('/cadastro');
    }
  };

  const handleGetStarted = () => {
    if (user) {
      console.log('Usuário logado, navegando para /home');
      navigate('/home');
    } else {
      console.log('Usuário não logado, navegando para /cadastro');
      navigate('/cadastro');
    }
  };
  return <div className="bg-black font-sans antialiased text-white overflow-x-hidden" style={{
    fontFamily: "'Inter', sans-serif"
  }}>
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '1s'
      }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_50%)]"></div>
      </div>

      {/* Navigation */}
      <header className="relative z-50 border-b border-white/10 glass sticky top-0" style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)'
    }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <nav className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="#" className="flex items-center gap-3 text-lg font-semibold group">
              <img 
                src={nextfundLogo} 
                alt="NextFund" 
                className="h-40 hover:scale-105 transition-transform duration-300" 
              />
            </a>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8 animate-fade-in-up delay-200">
              <div className="flex items-center gap-6 text-sm font-medium">
                <a href="#" className="px-4 py-2 bg-green-500/20 text-white rounded-2xl hover:bg-green-500/30 transition-all duration-300 backdrop-blur-sm border border-green-500/30">Tarefas</a>
                <a href="#" className="text-white/70 hover:text-white transition-colors duration-300">Vídeos</a>
                <div className="relative group">
                  <button className="flex items-center gap-1 text-white/70 hover:text-white transition-colors duration-300">
                    Produtos <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <a href="#" className="text-white/70 hover:text-white transition-colors duration-300">Suporte</a>
                <a href="#" className="text-white/70 hover:text-white transition-colors duration-300">Aprender</a>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-px h-6 bg-white/20"></div>
                <button onClick={() => {
                  console.log('Botão header clicado! Navegando para /login');
                  navigate('/login');
                }} className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300">Entrar</button>
                <button onClick={handleGetStarted} className="text-sm font-medium text-black bg-green-500 hover:bg-green-600 transition-all duration-300 rounded-2xl px-6 py-2.5 shadow-lg shadow-green-500/25">
                  {user ? 'Dashboard' : 'Começar'}
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button className="lg:hidden p-2 hover:bg-white/10 rounded-2xl transition-colors duration-300">
              <Menu className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </header>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
            
            {/* Hero Content - Spans 5 columns */}
            <div className="lg:col-span-5 animate-slide-in-left delay-300">
              <div className="gradient-border rounded-3xl mb-8 inline-block" style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3))',
              padding: '1px'
            }}>
                <div className="bg-black rounded-3xl px-4 py-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white/80">Plataforma de Ganhos</span>
                  </div>
                </div>
              </div>

              <h1 className="sm:text-7xl xl:text-8xl leading-none text-6xl font-medium tracking-tighter mb-8">
                <span className="block text-white">Ganhe Dinheiro</span>
                <span className="block" style={{
                background: 'linear-gradient(135deg, #22c55e, #10b981)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Assistindo Vídeos 🚀</span>
              </h1>

              <p className="text-xl text-white/70 mb-10 max-w-lg leading-relaxed">
                Transforme minutos do seu dia em saldo real. Assista, responda e receba na hora via PIX.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-16">
                <button 
                  onClick={handleStartEarning}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-3xl transition-all duration-300 shadow-xl shadow-green-500/25 transform hover:scale-105"
                >
                  Começar Agora e Ganhar
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-white mb-1">R$50K+</div>
                  <div className="text-sm text-white/60">Pagos Hoje</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-white mb-1">25K+</div>
                  <div className="text-sm text-white/60">Usuários Ativos</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-white mb-1">5M+</div>
                  <div className="text-sm text-white/60">Vídeos Assistidos</div>
                </div>
              </div>
            </div>

            {/* Earnings Card - Spans 4 columns */}
            <div className="lg:col-span-4 animate-fade-in-up delay-500">
              <div className="rounded-3xl p-8 backdrop-blur-xl border border-white/20 shadow-2xl animate-float" style={{
              background: 'rgba(255, 255, 255, 0.05)',
              animation: 'float 6s ease-in-out infinite'
            }}>
                
                {/* Simulator Card */}
                <SimulatorCard />
              </div>
            </div>

            {/* Market Data - Spans 3 columns */}
            <div className="lg:col-span-3 space-y-6 animate-slide-in-right delay-700">
              

              {/* Security Features */}
              <div className="rounded-3xl p-6 backdrop-blur-xl border border-white/20" style={{
              background: 'rgba(255, 255, 255, 0.05)'
            }}>
                <h3 className="text-lg font-semibold text-white mb-6">Segurança Garantida</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-colors duration-300">
                    <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Lock className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-sm text-white/80">🔒 Pagamentos Instantâneos via PIX</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-colors duration-300">
                    <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-sm text-white/80">🛡️ Sistema Antifraude Garantido</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-colors duration-300">
                    <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-sm text-white/80">⚡ Saldo Atualizado em Tempo Real</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up delay-800">
            
            <div className="rounded-3xl p-8 backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:scale-[1.02] group" style={{
            background: 'rgba(255, 255, 255, 0.05)'
          }}>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 tracking-tight">Ganhos Rápidos ⚡</h3>
              <p className="text-white/70 leading-relaxed mb-8">Assista vídeos curtos e receba em segundos.</p>
              <div className="flex items-center gap-2 text-white font-medium hover:text-green-300 transition-colors duration-300 cursor-pointer">
                Saiba mais
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            <div className="rounded-3xl p-8 backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:scale-[1.02] group" style={{
            background: 'rgba(255, 255, 255, 0.05)'
          }}>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 tracking-tight">Tarefas Simples ✅</h3>
              <p className="text-white/70 leading-relaxed mb-8">Basta clicar na resposta e pronto.</p>
              <div className="flex items-center gap-2 text-white font-medium hover:text-green-300 transition-colors duration-300 cursor-pointer">
                Saiba mais
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            <div className="rounded-3xl p-8 backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:scale-[1.02] group" style={{
            background: 'rgba(255, 255, 255, 0.05)'
          }}>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 tracking-tight">Pagamentos Garantidos 💸</h3>
              <p className="text-white/70 leading-relaxed mb-8">PIX direto na sua conta, sem enrolação.</p>
              <div className="flex items-center gap-2 text-white font-medium hover:text-green-300 transition-colors duration-300 cursor-pointer">
                Saiba mais
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Extra Call to Action */}
          <div className="text-center mt-24 mb-16">
            <div className="rounded-3xl p-12 backdrop-blur-xl border border-white/20" style={{
              background: 'rgba(255, 255, 255, 0.05)'
            }}>
              <h2 className="text-4xl font-bold text-white mb-6">
                Já pagamos milhares de reais para usuários todos os dias.
              </h2>
              <p className="text-2xl text-white/80 mb-8">
                O próximo pode ser você!
              </p>
              <button 
                onClick={handleStartEarning}
                className="px-12 py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xl font-bold rounded-3xl transition-all duration-300 shadow-xl shadow-green-500/25 transform hover:scale-105"
              >
                Quero Começar Agora 🚀
              </button>
            </div>
          </div>
        </section>

        {/* Footer Section */}
        <footer className="border-t border-white/10 mt-32 py-8">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            {/* Bottom Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-white/60 text-sm">© 2025 NextFund. Todos os direitos reservados.</p>
              <div className="flex items-center gap-6 text-sm text-white/60">
                <span>🌍 Português</span>
                <span>💱 BRL</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>;
}