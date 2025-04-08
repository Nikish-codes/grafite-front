import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Tab } from '@headlessui/react';
import Layout from '../components/layout/Layout';
import AnalyticsDashboard from '../features/analytics/AnalyticsDashboard';
import ProgressTracker from '../features/analytics/ProgressTracker';

const AnalyticsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { name: 'Dashboard', component: <AnalyticsDashboard /> },
    { name: 'Progress Tracker', component: <ProgressTracker /> },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-0">Analytics & Progress</h1>
          
          {user ? (
            <div className="bg-primary/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg w-full md:w-auto">
              <p className="text-xs sm:text-sm font-medium text-primary">
                Welcome back, {user.displayName || 'Student'}!
              </p>
              <p className="text-xs text-gray-600">
                Track your progress and performance
              </p>
            </div>
          ) : null}
        </div>

        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-4 sm:mb-8 overflow-x-auto">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `w-full rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm font-medium leading-5 transition-all whitespace-nowrap
                  ${selected
                    ? 'bg-white dark:bg-gray-700 shadow text-primary'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-primary'}`
                }
              >
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels>
            {tabs.map((tab, idx) => (
              <Tab.Panel key={idx} className="focus:outline-none">
                {tab.component}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;