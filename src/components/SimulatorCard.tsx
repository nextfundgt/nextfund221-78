import React, { useState, useEffect } from "react";
import { DollarSign, Calendar, TrendingUp, Settings, RotateCcw, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function SimulatorCard() {
  const [videoCount, setVideoCount] = useState(5);
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [estimatedEarnings, setEstimatedEarnings] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartEarning = () => {
    if (user) {
      navigate('/home');
    } else {
      navigate('/cadastro');
    }
  };

  // Plan rates per video
  const planRates = {
    free: { rate: 2.00, label: "Free" },
    vip1: { rate: 5.00, label: "VIP1" },
    vip2: { rate: 8.00, label: "VIP2" },
    vip3: { rate: 12.00, label: "VIP3" }
  };

  // Calculate earnings based on videos and plan
  useEffect(() => {
    const currentRate = planRates[selectedPlan as keyof typeof planRates].rate;
    const totalEarnings = videoCount * currentRate;
    setEstimatedEarnings(totalEarnings);
  }, [videoCount, selectedPlan]);

  const planOptions = [
    { value: 'free', label: "Free - R$2 por vídeo" },
    { value: 'vip1', label: "VIP1 - R$5 por vídeo" },
    { value: 'vip2', label: "VIP2 - R$8 por vídeo" },
    { value: 'vip3', label: "VIP3 - R$12 por vídeo" }
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">Calcule seus ganhos agora</h3>
          <p className="text-sm text-white/60">Veja quanto você pode ganhar assistindo vídeos</p>
        </div>
        <div className="flex gap-2">
          <button className="p-3 hover:bg-white/10 rounded-2xl transition-colors duration-300">
            <RotateCcw className="w-4 h-4 text-white/60" />
          </button>
          <button className="p-3 hover:bg-white/10 rounded-2xl transition-colors duration-300">
            <Settings className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Quantidade de Vídeos Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-white">Quantos vídeos você quer assistir hoje?</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-3 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 rounded-2xl transition-colors duration-300 border border-green-500/30">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">📹</span>
            </div>
            <span className="text-sm font-medium text-white">Vídeos</span>
          </div>
          
          <div className="flex-1 text-right">
            <input 
              type="number" 
              min="1"
              max="50"
              value={videoCount}
              onChange={(e) => setVideoCount(Number(e.target.value))}
              className="w-full bg-transparent text-2xl font-semibold text-white text-right outline-none" 
            />
          </div>
        </div>
      </div>

      {/* Plano Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">Plano</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
          <div className="relative flex-1">
            <select 
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full bg-transparent text-lg font-medium text-white outline-none appearance-none cursor-pointer"
            >
              {planOptions.map(option => (
                <option key={option.value} value={option.value} className="bg-gray-900 text-white">
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Ganhos Estimados Section */}
      <div className="space-y-3 mb-8 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-white">Seus Ganhos</span>
        </div>
        
        <div className="text-center">
          <div className="text-4xl font-bold text-green-400 mb-2">
            R${estimatedEarnings.toFixed(2)} 💸
          </div>
          <div className="text-lg text-emerald-300">
            Você pode ganhar isso hoje!
          </div>
          <div className="text-sm text-white/60 mt-2">
            {videoCount} vídeos × R${planRates[selectedPlan as keyof typeof planRates].rate.toFixed(2)} = R${estimatedEarnings.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Quero Ganhar Button */}
      <button 
        onClick={handleStartEarning}
        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-green-500/25 transform hover:scale-[1.02] text-lg"
      >
        Quero Ganhar Agora 🚀
      </button>
    </>
  );
}