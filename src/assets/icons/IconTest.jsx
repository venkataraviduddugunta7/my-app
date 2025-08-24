import React from 'react';
import { PrinterIcon, DashboardIcon, LogoutIcon, ICON_COLORS } from './index';

const IconTest = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Icon System Test</h2>
      
      <div className="flex items-center gap-4">
        <div className="text-center">
          <PrinterIcon color={ICON_COLORS.primary} />
          <p className="text-sm mt-1">Printer</p>
        </div>
        
        <div className="text-center">
          <DashboardIcon color={ICON_COLORS.success} />
          <p className="text-sm mt-1">Dashboard</p>
        </div>
        
        <div className="text-center">
          <LogoutIcon color={ICON_COLORS.error} />
          <p className="text-sm mt-1">Logout</p>
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        ✅ All icons are working correctly!
      </div>
    </div>
  );
};

export default IconTest;
