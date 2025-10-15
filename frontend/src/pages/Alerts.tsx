import React, { useState, useEffect } from 'react';
import { Alert } from '../types';
import { alertAPI } from '../services/api';
import Layout from '../components/Layout';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const data = await alertAPI.getAll();
      setAlerts(data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: number) => {
    try {
      await alertAPI.acknowledge(alertId);
      fetchAlerts(); // Refresh the list
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const getAlertSeverity = (ruleJson: string) => {
    try {
      const rule = JSON.parse(ruleJson);
      if (rule.metric === 'temperature' && rule.threshold > 50) return 'critical';
      if (rule.metric === 'co2_ppm' && rule.threshold > 1300) return 'critical';
      if (rule.metric === 'temperature' && rule.threshold > 45) return 'warning';
      if (rule.metric === 'co2_ppm' && rule.threshold > 1000) return 'warning';
      return 'info';
    } catch {
      return 'info';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRule = (ruleJson: string) => {
    try {
      const rule = JSON.parse(ruleJson);
      return `${rule.metric} ${rule.operator} ${rule.threshold}`;
    } catch {
      return 'Invalid rule';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
              <p className="mt-2 text-sm text-gray-700">
                Monitor and manage system alerts and notifications.
              </p>
            </div>
          </div>

          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Device
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Rule
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Severity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Triggered At
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {alerts.map((alert) => {
                        const severity = getAlertSeverity(alert.rule_json);
                        return (
                          <tr key={alert.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {alert.device_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatRule(alert.rule_json)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(severity)}`}>
                                {severity}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                                {alert.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(alert.triggered_at).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {alert.status === 'active' && (
                                <button
                                  onClick={() => handleAcknowledge(alert.id)}
                                  className="text-primary-600 hover:text-primary-900"
                                >
                                  Acknowledge
                                </button>
                              )}
                              {alert.status === 'acknowledged' && (
                                <span className="text-gray-500">
                                  Acknowledged {alert.ack_at ? new Date(alert.ack_at).toLocaleString() : ''}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {alerts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <div className="text-4xl mb-4">🚨</div>
                <h3 className="text-lg font-medium">No alerts</h3>
                <p className="text-sm">All systems are running normally.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Alerts;