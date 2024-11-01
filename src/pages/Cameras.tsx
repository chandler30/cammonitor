import { useState, useEffect } from 'react';
import axios from 'axios';

interface Camera {
  id: number;
  ip: string;
  status: 'online' | 'offline';
  lastSeen: string;
  type: string;
}

export default function Cameras() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  
  useEffect(() => {
    // Function to fetch cameras and found devices
    const fetchCameras = async () => {
      const token = localStorage.getItem('token');
      const camerasResponse = await axios.get('http://localhost:5001/api/cameras', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const foundDevicesResponse = await axios.get('http://localhost:5001/api/found-devices', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const foundDevices = foundDevicesResponse.data.data;
      const cameras = camerasResponse.data.data;

      // Merge cameras with found devices based on IP address
      const mergedData = foundDevices
        .filter(device => device.type === 'camera')
        .map(device => {
          const camera = cameras.find(cam => cam.ip === device.ip);
          return {
            ...camera,
            ...device,
            status: camera?.status || 'offline',
          };
        });

      setCameras(mergedData);
    };

    fetchCameras();

    // Ping the cameras every 2 minutes to check their status
    const intervalId = setInterval(fetchCameras, 120000); // 120000 ms = 2 minutes
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Camera List</h2>
      <div className="bg-white shadow-sm rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Seen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cameras.map((camera) => (
                <tr key={camera.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {camera.ip}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        camera.status === 'online'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {camera.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {camera.lastSeen}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {camera.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-indigo-600 hover:text-indigo-900">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
