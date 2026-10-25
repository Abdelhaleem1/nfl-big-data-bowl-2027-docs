import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { DatasetsPage } from './pages/DatasetsPage';
import { TableDetailPage } from './pages/TableDetailPage';
import { DictionaryPage } from './pages/DictionaryPage';
import { DataModelPage } from './pages/DataModelPage';
import { ResearchQuestionsPage } from './pages/ResearchQuestionsPage';
import { FeatureEngineeringPage } from './pages/FeatureEngineeringPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { VisualExplorerPage } from './pages/VisualExplorerPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { SourcesPage } from './pages/SourcesPage';
import { GlossaryPage } from './pages/GlossaryPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="datasets" element={<DatasetsPage />} />
        <Route path="tables/:tableId" element={<TableDetailPage />} />
        <Route path="dictionary" element={<DictionaryPage />} />
        <Route path="data-model" element={<DataModelPage />} />
        <Route path="research-questions" element={<ResearchQuestionsPage />} />
        <Route path="feature-engineering" element={<FeatureEngineeringPage />} />
        <Route path="data-quality" element={<DataQualityPage />} />
        <Route path="visual-explorer" element={<VisualExplorerPage />} />
        <Route path="methodology" element={<MethodologyPage />} />
        <Route path="sources" element={<SourcesPage />} />
        <Route path="glossary" element={<GlossaryPage />} />
      </Route>
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
};

export default App;
