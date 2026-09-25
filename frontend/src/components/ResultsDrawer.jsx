import React from 'react';
import ResultsWorkspace from './results/ResultsWorkspace';

export default function ResultsDrawer({
  results,
  isOpen,
  onClose,
  onMinimize,
  viewMode = 'studio',
  onToggleViewMode,
  activeCategory = 'super_resolution',
  activeSubOption = 'slider',
  onCategoryChange,
  onSubOptionChange,
  onFlyToCoords
}) {
  return (
    <ResultsWorkspace
      results={results}
      isOpen={isOpen}
      onClose={onClose}
      onMinimize={onMinimize}
      viewMode={viewMode}
      onToggleViewMode={onToggleViewMode}
      activeCategory={activeCategory}
      activeSubOption={activeSubOption}
      onCategoryChange={onCategoryChange}
      onSubOptionChange={onSubOptionChange}
      onFlyToCoords={onFlyToCoords}
    />
  );
}
