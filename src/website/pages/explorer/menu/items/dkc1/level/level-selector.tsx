import React, { useLayoutEffect, useState } from 'react';
import { Menu } from '../../../../../../components/menu';
import { DKC1_LEVELS } from './level-list';
import { Level, LevelItem } from './types';

interface LevelSelectorProps {
  onSelectLevel: (level: Level) => void;
}

export const LevelSelector = ({ onSelectLevel }: LevelSelectorProps) => {
  const [selectedItem, setSelectedItem] = useState<LevelItem | null>(null);

  useLayoutEffect(() => {
    if (selectedItem) onSelectLevel(selectedItem.value);
  }, [selectedItem]);

  return (
    <Menu<Level>
      groups={DKC1_LEVELS}
      selectedItem={selectedItem}
      onSelectItem={(item) => {
        setSelectedItem(item);
      }}
    />
  );
};
