import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  ChevronDown, 
  LogOut, 
  ShieldCheck, 
  Users, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { MP_TEAMS } from '../../constants/jiraConstants';

export default function Header({ 
  user = 'Hüseyin Ç.', 
  selectedTeam, 
  onSelectTeam, 
  onLogout 
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          
          {/* Sol Taraf: Minimal Logo & İsim */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg jira-gradient-bg flex items-center justify-center text-white shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Jira <span className="text-jira-600">AI</span> Test Asistanı
              </span>
              <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
                <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                Gemini Flash
              </span>
            </div>
          </div>

          {/* Sağ Taraf: Takım Rozeti & Kullanıcı Profili */}
          <div className="flex items-center gap-3">
            
            {/* MPTeam Seçici */}
            {selectedTeam && (
              <div className="relative">
                <button
                  onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  title="Çalışma Ekibini Değiştir"
                >
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-800">{selectedTeam}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${teamDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Team Dropdown Menu */}
                {teamDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in">
                    <div className="px-3 py-1 border-b border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        MPTeam Seçimi
                      </p>
                    </div>
                    <div className="py-1">
                      {MP_TEAMS.map((team) => (
                        <button
                          key={team.id}
                          onClick={() => {
                            onSelectTeam(team.name);
                            setTeamDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            selectedTeam === team.name
                              ? 'bg-jira-50 text-jira-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{team.name}</p>
                            <p className="text-[10px] text-slate-400">{team.domain}</p>
                          </div>
                          {selectedTeam === team.name && (
                            <Check className="w-3.5 h-3.5 text-jira-600 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Kullanıcı Profili (Hüseyin Ç.) */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-jira-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  HÇ
                </div>
                <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                  {user}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 hidden sm:inline transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user}</p>
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      Jira PAT Aktif
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Oturumu Kapat
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
