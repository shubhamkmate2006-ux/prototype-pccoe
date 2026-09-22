import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MetricsHeader from './components/MetricsHeader';
import FilterBar from './components/FilterBar';
import AnalyticsCharts from './components/AnalyticsCharts';
import LiveFeed from './components/LiveFeed';
import MapVisualization from './components/MapVisualization';
import SOSAlertGenerator from './components/SOSAlertGenerator';
import ReportModal from './components/ReportModal';
import PortfolioLanding from './components/PortfolioLanding';
import BootSequence from './components/BootSequence';
import TerminalFeed from './components/TerminalFeed';
import WeatherWidget from './components/WeatherWidget';
import { initialReports, initialStats, eventCategories, locations } from './data/mockData';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'booting' | 'dashboard'

  const [reports, setReports] = useState(initialReports);
  const [stats, setStats] = useState(initialStats);
  const [activeSidebarFilter, setActiveSidebarFilter] = useState('All');
  
  // Advanced Filters
  const [dateFilter, setDateFilter] = useState('Today');
  const [categoryFilter, setCategoryFilter] = useState('All Events');
  const [locationFilter, setLocationFilter] = useState('All India');

  const [selectedReport, setSelectedReport] = useState(null);

  // Simulate incoming real-time data & deduplication
  useEffect(() => {
    const interval = setInterval(() => {
      // 20% chance it's a duplicate
      const isDuplicate = Math.random() > 0.8;
      
      const newReport = {
        id: `rep-new-${Date.now()}`,
        type: eventCategories[Math.floor(Math.random() * eventCategories.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        coords: { lat: 10 + Math.random() * 20, lng: 70 + Math.random() * 20 },
        timestamp: new Date().toISOString(),
        description: isDuplicate ? 'This looks exactly like a previous report. #IMD' : 'New crowd-sourced report just arrived. #WeatherAlert',
        source: 'Citizen App',
        citizenScore: Math.floor(Math.random() * 100),
        status: 'Pending',
        impactRadiusKm: 0,
        media: Math.random() > 0.5 ? 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=500&q=80' : null,
        isDuplicate: false
      };

      setReports(prev => [newReport, ...prev].slice(0, 50)); 
      
      if (!isDuplicate) {
        setStats(prev => ({ ...prev, totalReports: prev.totalReports + 1 }));
      }

      // AI Processing Delay
      setTimeout(() => {
        if (isDuplicate) {
           setStats(prev => ({ ...prev, duplicatesRemoved: prev.duplicatesRemoved + 1 }));
           setReports(current => current.map(r => r.id === newReport.id ? { ...r, isDuplicate: true, aiAnalysis: 'DEDUPLICATED: Matches existing event cluster.' } : r));
        } else {
          setReports(current => 
            current.map(r => {
              if (r.id === newReport.id) {
                const isFake = Math.random() > 0.7;
                if(isFake) setStats(prev => ({ ...prev, fakeDetected: prev.fakeDetected + 1 }));
                return { 
                  ...r, 
                  status: isFake ? 'Fake' : 'Verified',
                  impactRadiusKm: isFake ? 0 : 10,
                  aiAnalysis: isFake ? 'Image metadata shows photo is from 2021.' : 'Cross-referenced with local sensors and NLP analysis.'
                };
              }
              return r;
            })
          );
        }
      }, 3000);

    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const filteredReports = reports.filter(r => {
    // Hide duplicates from main view
    if (r.isDuplicate) return false;

    // Sidebar logic
    if (activeSidebarFilter === 'Verified' && r.status !== 'Verified') return false;
    if (activeSidebarFilter === 'Fake' && r.status !== 'Fake') return false;
    if (activeSidebarFilter === 'Pending' && r.status !== 'Pending') return false;

    // Topbar logic
    // (Note: Date filtering is simplified for the prototype as all incoming streaming data is real-time/today)
    if (categoryFilter !== 'All Events' && r.type !== categoryFilter) return false;
    if (locationFilter !== 'All India' && !r.location.includes(locationFilter)) return false;
    
    return true;
  });

  if (currentView === 'landing') {
    return <PortfolioLanding onLaunch={() => setCurrentView('booting')} />;
  }

  if (currentView === 'booting') {
    return <BootSequence onComplete={() => setCurrentView('dashboard')} />;
  }

  const runStressTest = () => {
    const stressReports = Array.from({ length: 5 }).map((_, i) => ({
      id: `stress-${Date.now()}-${i}`,
      type: eventCategories[Math.floor(Math.random() * eventCategories.length)],
      location: locations[Math.floor(Math.random() * (locations.length - 1)) + 1],
      coords: { lat: 10 + Math.random() * 20, lng: 70 + Math.random() * 20 },
      timestamp: new Date().toISOString(),
      description: 'CRITICAL EVENT INJECTED VIA AI STRESS TEST.',
      source: 'Stress Test System',
      citizenScore: 99,
      status: 'Verified',
      impactRadiusKm: Math.floor(Math.random() * 20) + 10,
      media: null,
      isDuplicate: false,
      aiAnalysis: 'SATELLITE VERIFIED VIA STRESS TEST PROTOCOL.'
    }));

    setReports(prev => [...stressReports, ...prev].slice(0, 100));
    setStats(prev => ({
      ...prev,
      totalReports: prev.totalReports + 5,
      verifiedEvents: prev.verifiedEvents + 5
    }));
  };

  return (
    <div className="flex w-full h-full">
      <Sidebar activeFilter={activeSidebarFilter} setActiveFilter={setActiveSidebarFilter} onStressTest={runStressTest} />
      <div style={{ marginLeft: '290px', padding: '20px', width: 'calc(100% - 290px)' }}>
        
        <MetricsHeader stats={stats} />
        
        <FilterBar 
          dateFilter={dateFilter} setDateFilter={setDateFilter}
          categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
          locationFilter={locationFilter} setLocationFilter={setLocationFilter}
        />
        
        <div className="flex gap-6" style={{ alignItems: 'stretch', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', minWidth: '400px' }}>
            <MapVisualization reports={filteredReports} onReportClick={setSelectedReport} selectedReport={selectedReport} />
            <div className="flex gap-4 mt-4" style={{ marginTop: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px' }}><AnalyticsCharts reports={reports} /></div>
              <div style={{ flex: '1 1 200px' }}><TerminalFeed /></div>
              <div style={{ flex: '1 1 200px' }}><WeatherWidget coords={selectedReport?.coords} /></div>
              <div style={{ flex: '1 1 200px' }}><SOSAlertGenerator /></div>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: '300px' }}>
            <LiveFeed reports={filteredReports} onReportClick={setSelectedReport} />
          </div>
        </div>
      </div>

      {selectedReport && (
        <ReportModal 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
          onVerify={(id) => {
            setReports(current => current.map(r => r.id === id ? {
              ...r,
              status: 'Verified',
              aiAnalysis: 'SATELLITE VERIFIED: Ground sensors and drone flyover confirmed event severity.',
              impactRadiusKm: 12
            } : r));
            setSelectedReport(prev => ({...prev, status: 'Verified', aiAnalysis: 'SATELLITE VERIFIED: Ground sensors and drone flyover confirmed event severity.', impactRadiusKm: 12}));
          }}
        />
      )}
    </div>
  );
}

export default App;
