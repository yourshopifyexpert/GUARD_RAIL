import React, { useCallback } from 'react';
import { List, ListRowProps, AutoSizer } from 'react-virtualized';
import 'react-virtualized/styles.css';
import './VirtualList.css';

export interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  rowHeight: number | ((params: { index: number }) => number);
  onItemClick?: (item: T, index: number) => void;
  selectedIndex?: number;
  emptyMessage?: string;
}

export function VirtualList<T>({
  items,
  renderItem,
  rowHeight,
  onItemClick,
  selectedIndex,
  emptyMessage = 'No items to display'
}: VirtualListProps<T>): React.ReactElement {
  const rowRenderer = useCallback(
    ({ index, key, style }: ListRowProps) => {
      const item = items[index];
      const isSelected = selectedIndex === index;

      return (
        <div
          key={key}
          style={style}
          className={`virtual-list-item ${isSelected ? 'virtual-list-item--selected' : ''}`}
          onClick={() => onItemClick?.(item, index)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onItemClick?.(item, index);
            }
          }}
        >
          {renderItem(item, index)}
        </div>
      );
    },
    [items, renderItem, onItemClick, selectedIndex]
  );

  if (items.length === 0) {
    return (
      <div className="virtual-list-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="virtual-list-container">
      <AutoSizer>
        {({ height, width }) => (
          <List
            width={width}
            height={height}
            rowCount={items.length}
            rowHeight={rowHeight}
            rowRenderer={rowRenderer}
            overscanRowCount={5}
          />
        )}
      </AutoSizer>
    </div>
  );
}
