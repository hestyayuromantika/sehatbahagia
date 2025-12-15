import { AgentType, AgentConfig } from './types';
import React from 'react';

// Using a map for O(1) access
export const AGENTS: Record<AgentType, AgentConfig> = {
  [AgentType.NAVIGATOR]: {
    id: AgentType.NAVIGATOR,
    name: 'Hospital Navigator',
    roleDescription: 'Menganalisis dan mendelegasikan permintaan.',
    color: 'bg-gray-800',
    iconName: 'Compass',
  },
  [AgentType.MEDICAL_RECORDS]: {
    id: AgentType.MEDICAL_RECORDS,
    name: 'Agen Rekam Medis',
    roleDescription: 'Hasil tes, diagnosis, riwayat perawatan.',
    color: 'bg-emerald-600',
    iconName: 'FileText',
  },
  [AgentType.BILLING]: {
    id: AgentType.BILLING,
    name: 'Agen Penagihan & Asuransi',
    roleDescription: 'Faktur, asuransi, pembayaran.',
    color: 'bg-amber-600',
    iconName: 'CreditCard',
  },
  [AgentType.PATIENT_INFO]: {
    id: AgentType.PATIENT_INFO,
    name: 'Agen Informasi Pasien',
    roleDescription: 'Pendaftaran, pembaruan data.',
    color: 'bg-blue-600',
    iconName: 'User',
  },
  [AgentType.SCHEDULER]: {
    id: AgentType.SCHEDULER,
    name: 'Penjadwal Janji Temu',
    roleDescription: 'Buat, ubah, atau batal janji temu.',
    color: 'bg-purple-600',
    iconName: 'Calendar',
  },
};
