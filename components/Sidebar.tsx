import React from 'react';
import { AgentType } from '../types';
import { AGENTS } from '../constants';
import { 
  Compass, 
  FileText, 
  CreditCard, 
  User, 
  Calendar, 
  Activity 
} from 'lucide-react';

interface SidebarProps {
  activeAgent: AgentType;
}

const IconMap: Record<string, React.FC<any>> = {
  'Compass': Compass,
  'FileText': FileText,
  'CreditCard': CreditCard,
  'User': User,
  'Calendar': Calendar,
};

const Sidebar: React.FC<SidebarProps> = ({ activeAgent }) => {
  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
          <Activity className="text-white w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-gray-800 leading-tight">MediNav</h2>
          <p className="text-xs text-gray-500 font-medium">Hospital OS</p>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Active Agents</p>
        
        {Object.values(AGENTS).map((agent) => {
          const isActive = activeAgent === agent.id;
          const Icon = IconMap[agent.iconName];
          
          return (
            <div
              key={agent.id}
              className={`
                relative flex items-center gap-3 p-3 rounded-xl transition-all duration-300
                ${isActive ? 'bg-white shadow-md border border-gray-100' : 'hover:bg-gray-100 border border-transparent'}
              `}
            >
              {/* Active Indicator Line */}
              {isActive && (
                <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${agent.color}`} />
              )}

              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                ${isActive ? agent.color : 'bg-gray-200'}
                transition-colors duration-300
              `}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
              </div>
              
              <div className="flex flex-col overflow-hidden">
                <span className={`text-sm font-semibold truncate ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                  {agent.name}
                </span>
                <span className="text-[10px] text-gray-400 truncate leading-tight">
                  {agent.roleDescription}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-xs text-blue-800 font-medium text-center">
          Sistem Aman & Terenkripsi
        </p>
      </div>
    </div>
  );
};

export default Sidebar;