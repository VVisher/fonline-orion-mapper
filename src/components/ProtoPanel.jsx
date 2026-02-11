/**
 * ProtoPanel - Uses BaseWindow with proto functionality
 * Golden standard design from History window
 */

import React, { useState, useEffect } from 'react';
import BaseWindow from '../ui/BaseWindow';
import { getBrowserProtoDatabaseManager } from '../database/BrowserProtoDatabaseManager';

export default function ProtoPanel({ docked = false, onToggleDock = () => {} }) {
  const [protos, setProtos] = useState([]);
  const [filteredProtos, setFilteredProtos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dbManager, setDbManager] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProto, setSelectedProto] = useState(null);

  // Initialize database manager
  useEffect(() => {
    const manager = getBrowserProtoDatabaseManager();
    setDbManager(manager);
    
    const initializeDatabase = async () => {
      setIsLoading(true);
      const success = await manager.initialize();
      if (success) {
        const protos = manager.getProtos();
        setProtos(protos);
        setFilteredProtos(protos);
      }
      setIsLoading(false);
    };

    initializeDatabase();
  }, []);

  // Filter protos based on search and filters
  useEffect(() => {
    if (!dbManager || !dbManager.isLoaded) return;

    const filters = {};
    if (searchTerm) filters.search = searchTerm;
    if (selectedType !== 'all') filters.type = parseInt(selectedType);
    if (selectedCategory !== 'all') filters.category = selectedCategory;

    const filtered = dbManager.getProtos(filters);
    setFilteredProtos(filtered);
  }, [searchTerm, selectedType, selectedCategory, dbManager]);

  // Get types and categories for filters
  const { types, categories } = React.useMemo(() => {
    if (!dbManager || !dbManager.isLoaded) {
      return { types: [], categories: [] };
    }

    return {
      types: dbManager.getProtoTypes(),
      categories: dbManager.getCategories()
    };
  }, [dbManager]);

  // Get type name
  const getTypeName = (typeId) => {
    const type = types.find(t => t.type_id === typeId);
    return type ? type.type_name : `Unknown(${typeId})`;
  };

  // Get status color
  const getStatusColor = (proto) => {
    if (proto.collision && proto.interactive) return '#ff6b6b';
    if (proto.collision) return '#ffd93d';
    if (proto.interactive) return '#6bcf7f';
    return '#888';
  };

  const countText = `${filteredProtos.length} / ${protos.length}`;

  const actions = (
    <>
      <button
        style={styles.actionBtn}
        onClick={() => setSelectedProto(null)}
      >
        Clear
      </button>
      <button
        style={styles.actionBtn}
        onClick={() => {
          setSearchTerm('');
          setSelectedType('all');
          setSelectedCategory('all');
        }}
      >
        Reset
      </button>
    </>
  );

  return (
    <BaseWindow
      title="Protos"
      docked={docked}
      onToggleDock={onToggleDock}
      count={countText}
      showActions={true}
      actions={actions}
      defaultSize={{ width: 350, height: 400 }}
    >
      {/* Filters */}
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search protos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Types</option>
          {types.map(type => (
            <option key={type.type_id} value={type.type_id}>
              {type.type_name}
            </option>
          ))}
        </select>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category.category_id} value={category.category_name}>
              {category.category_name}
            </option>
          ))}
        </select>
      </div>

      {/* Proto list */}
      {isLoading ? (
        <div style={styles.empty}>Loading protos...</div>
      ) : filteredProtos.length === 0 ? (
        <div style={styles.empty}>No protos found.</div>
      ) : (
        filteredProtos.map(proto => (
          <div
            key={proto.protoId}
            style={{
              ...styles.protoEntry,
              backgroundColor: selectedProto?.protoId === proto.protoId ? '#1a1a3e' : 'transparent'
            }}
            onClick={() => setSelectedProto(proto)}
            title={`ID: ${proto.protoId} | Type: ${getTypeName(proto.type)}`}
          >
            <span style={{
              ...styles.entryIcon,
              color: getStatusColor(proto)
            }}>
              ●
            </span>
            <span style={styles.entryLabel}>{proto.name}</span>
            <span style={styles.entryType}>{getTypeName(proto.type)}</span>
          </div>
        ))
      )}
    </BaseWindow>
  );
}

const styles = {
  filters: {
    display: 'flex',
    gap: '4px',
    padding: '4px 8px',
    borderBottom: '1px solid #2a2a4a',
    background: '#0a0a1a',
  },
  searchInput: {
    flex: 1,
    padding: '2px 4px',
    background: '#1a1a3e',
    border: '1px solid #333',
    borderRadius: 3,
    color: '#ccc',
    fontSize: '0.65rem',
  },
  filterSelect: {
    padding: '2px 4px',
    background: '#1a1a3e',
    border: '1px solid #333',
    borderRadius: 3,
    color: '#ccc',
    fontSize: '0.65rem',
  },
  protoEntry: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 8px',
    cursor: 'pointer',
    borderBottom: '1px solid #0a0a1a',
    transition: 'background 0.1s',
  },
  entryIcon: {
    fontSize: '0.6rem',
    color: '#44aaff',
    flexShrink: 0,
  },
  entryLabel: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '0.68rem',
  },
  entryType: {
    fontSize: '0.6rem',
    color: '#666',
    flexShrink: 0,
  },
  empty: {
    padding: '8px',
    color: '#333',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actionBtn: {
    flex: 1,
    padding: '3px 0',
    background: '#1a1a3e',
    color: '#aaa',
    border: '1px solid #333',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: '0.68rem',
  },
};
