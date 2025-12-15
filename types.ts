export enum AgentType {
  NAVIGATOR = 'NAVIGATOR',
  MEDICAL_RECORDS = 'MEDICAL_RECORDS',
  BILLING = 'BILLING',
  PATIENT_INFO = 'PATIENT_INFO',
  SCHEDULER = 'SCHEDULER',
}

export interface AgentConfig {
  id: AgentType;
  name: string;
  roleDescription: string;
  color: string;
  iconName: string; // Using Lucide names conceptually
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  agent?: AgentType; // The agent who sent this message
  timestamp: Date;
  isInternalLog?: boolean; // For showing routing logic in UI without it being a real chat bubble
}

export interface ChatState {
  messages: Message[];
  isRouting: boolean;
  isGenerating: boolean;
  activeAgent: AgentType;
}

export interface RoutingResponse {
  agent: AgentType;
  reasoning: string;
}
