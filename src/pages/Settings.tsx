import { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import {
  ShieldCheckIcon,
  BellIcon,
  GlobeAltIcon,
  ComputerDesktopIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';

interface ScanHistory {
  id: number;
  timestamp: string;
  devicesFound: number;
  newDevices: number;
}

export default function Settings() {
  const [ipRange, setIpRange] = useState({
    startIp: '192.168.1.1',
    endIp: '192.168.1.254',
  });
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [serverIp, setServerIp] = useState('');
  const [deviceTypes, setDeviceTypes] = useState<{ [ip: string]: string }>({});
  const [scanProgress, setScanProgress] = useState(0);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [persistedDevices, setPersistedDevices] = useState<{
    ip: string;
    type: string;
    lastSeen: string;
    status: 'online' | 'offline';
  }[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [serverResponse, devicesResponse, historyResponse] = await Promise.all([
          axios.get('http://localhost:5001/api/network/ip', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5001/api/found-devices', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5001/api/network/scan-history', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setServerIp(serverResponse.data.ipAddress);
        setPersistedDevices(devicesResponse.data.data);
        setScanHistory(historyResponse.data.data);

        // Construir el mapa de tipos de dispositivos
        const types = {};
        devicesResponse.data.data.forEach((device) => {
          types[device.ip] = device.type || '';
        });
        setDeviceTypes(types);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, []);

  const scanNetwork = async () => {
    try {
      setScanning(true);
      setError('');
      setScanProgress(0);

      const token = localStorage.getItem('token');
      const startHost = parseInt(ipRange.startIp.split('.')[3]);
      const endHost = parseInt(ipRange.endIp.split('.')[3]);
      const totalHosts = endHost - startHost + 1;

      const response = await axios.post(
        'http://localhost:5001/api/network/scan',
        {
          startIp: ipRange.startIp,
          endIp: ipRange.endIp,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / totalHosts) * 100;
            setScanProgress(Math.min(progress, 100));
          },
        }
      );

      const { onlineHosts, newDevices } = response.data.data;
      setScanResults(onlineHosts);

      // Actualizar la lista de dispositivos persistentes
      const devicesResponse = await axios.get(
        'http://localhost:5001/api/found-devices',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPersistedDevices(devicesResponse.data.data);

      // Actualizar el historial de escaneos
      const historyResponse = await axios.get(
        'http://localhost:5001/api/network/scan-history',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setScanHistory(historyResponse.data.data);

      // Mostrar notificación si se encontraron nuevos dispositivos
      if (newDevices > 0) {
        // Aquí podrías usar un sistema de notificaciones más sofisticado
        alert(`Se encontraron ${newDevices} nuevos dispositivos en la red!`);
      }
    } catch (error: any) {
      console.error('Error during network scan:', error);
      setError(error.response?.data?.message || 'Network scan failed');
    } finally {
      setScanning(false);
      setScanProgress(100);
    }
  };

  const updateDeviceType = async (ip: string, type: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5001/api/network/update-device-type',
        { ip, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDeviceTypes((prev) => ({ ...prev, [ip]: type }));

      // Actualizar la lista de dispositivos persistentes
      const devicesResponse = await axios.get(
        'http://localhost:5001/api/found-devices',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPersistedDevices(devicesResponse.data.data);
    } catch (error) {
      console.error('Error updating device type:', error);
    }
  };

  const removeDevice = async (ip: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/found-devices/${ip}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPersistedDevices((prev) => prev.filter((device) => device.ip !== ip));
    } catch (error) {
      console.error('Error removing device:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Server IP Card */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden transform hover:scale-105 transition-transform duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-center">
            <ComputerDesktopIcon className="h-6 w-6 text-blue-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              Server IP: {serverIp}
            </h3>
          </div>
        </div>
      </div>

      {/* Network Configuration */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-center">
            <GlobeAltIcon className="h-6 w-6 text-blue-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              Network Scanner
            </h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start IP Range
              </label>
              <input
                type="text"
                value={ipRange.startIp}
                onChange={(e) =>
                  setIpRange({ ...ipRange, startIp: e.target.value })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="192.168.1.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End IP Range
              </label>
              <input
                type="text"
                value={ipRange.endIp}
                onChange={(e) =>
                  setIpRange({ ...ipRange, endIp: e.target.value })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="192.168.1.254"
              />
            </div>
          </div>

          {/* Progress Bar */}
          {scanning && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              className={`btn-primary flex items-center ${
                scanning ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={scanNetwork}
              disabled={scanning}
            >
              {scanning && (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {scanning ? 'Scanning...' : 'Scan Network'}
            </button>
          </div>

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Scan History
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  {scanHistory.map((scan) => (
                    <div
                      key={scan.id}
                      className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm"
                    >
                      <div>
                        <p className="text-sm text-gray-600">
                          {new Date(scan.timestamp).toLocaleString()}
                        </p>
                        <p className="text-sm">
                          Found: {scan.devicesFound} devices (New:{' '}
                          {scan.newDevices})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Persisted Devices */}
          {persistedDevices.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Known Devices
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  {persistedDevices.map((device) => (
                    <div
                      key={device.ip}
                      className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm"
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{device.ip}</p>
                          <p className="text-sm text-gray-500">
                            Last seen: {new Date(device.lastSeen).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            device.status === 'online'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {device.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <select
                          value={deviceTypes[device.ip] || ''}
                          onChange={(e) =>
                            updateDeviceType(device.ip, e.target.value)
                          }
                          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Select type</option>
                          <option value="camera">Camera</option>
                          <option value="NVR">NVR</option>
                          <option value="switch">Switch</option>
                          <option value="PC">PC</option>
                        </select>
                        <button
                          onClick={() => removeDevice(device.ip)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
          <div className="flex items-center">
            <BellIcon className="h-6 w-6 text-purple-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              Notification Preferences
            </h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Email Notifications
                </h4>
                <p className="text-sm text-gray-500">
                  Receive email alerts for camera status changes
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onChange={setEmailNotifications}
                className={`${
                  emailNotifications ? 'bg-indigo-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    emailNotifications ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </Switch>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Push Notifications
                </h4>
                <p className="text-sm text-gray-500">
                  Get instant push notifications for critical events
                </p>
              </div>
              <Switch
                checked={pushNotifications}
                onChange={setPushNotifications}
                className={`${
                  pushNotifications ? 'bg-indigo-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    pushNotifications ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </Switch>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-6 w-6 text-green-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              Security Settings
            </h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Two-Factor Authentication
                </h4>
                <p className="text-sm text-gray-500">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onChange={setTwoFactorEnabled}
                className={`${
                  twoFactorEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </Switch>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}