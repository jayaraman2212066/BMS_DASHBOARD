import React from 'react';
import { Device } from '../types';
import { commandAPI } from '../services/api';

interface DeviceCardProps {
  device: Device;
  onUpdate?: () => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onUpdate }) => {
  const getStatusColor = (isOnline: boolean, status?: number) => {
    if (!isOnline) return 'bg-gray-500';
    if (status === 2) return 'bg-red-500';
    if (status === 1) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = (isOnline: boolean, status?: number) => {
    if (!isOnline) return 'Offline';
    if (status === 2) return 'Fault';
    if (status === 1) return 'Warning';
    return 'OK';
  };

  const handleCommand = async (commandType: string, payload?: any) => {
    try {
      await commandAPI.send({
        device_id: device.id,
        command_type: commandType,
        payload: payload ? JSON.stringify(payload) : undefined,
      });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error sending command:', error);
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${getStatusColor(device.is_online, device.telemetry.status)}`}>
              <span className="text-sm font-medium text-white">
                {device.protocol === 'Modbus' ? 'M' : 'B'}
              </span>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {device.name}
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {device.device_id}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500">Status:</span>
            <span className={`font-medium ${
              device.is_online 
                ? device.telemetry.status === 2 ? 'text-red-600' 
                  : device.telemetry.status === 1 ? 'text-yellow-600' 
                  : 'text-green-600'
                : 'text-gray-600'
            }`}>
              {getStatusText(device.is_online, device.telemetry.status)}
            </span>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500">Location:</span>
            <span className="text-gray-900">{device.location || 'N/A'}</span>
          </div>
          
          {device.telemetry.temperature && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500">Temperature:</span>
              <span className="text-gray-900">{device.telemetry.temperature}°C</span>
            </div>
          )}
          
          {device.telemetry.co2_ppm && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500">CO₂:</span>
              <span className="text-gray-900">{device.telemetry.co2_ppm} ppm</span>
            </div>
          )}
          
          {device.telemetry.humidity && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500">Humidity:</span>
              <span className="text-gray-900">{device.telemetry.humidity}%</span>
            </div>
          )}
          
          {device.telemetry.power_kw && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500">Power:</span>
              <span className="text-gray-900">{device.telemetry.power_kw} kW</span>
            </div>
          )}
        </div>
        
        <div className="mt-3 flex space-x-2">
          <button
            onClick={() => handleCommand('RESTART')}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-xs px-3 py-2 rounded-md"
          >
            Restart
          </button>
          <button
            onClick={() => handleCommand('TOGGLE')}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-xs px-3 py-2 rounded-md"
          >
            Toggle
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceCard;