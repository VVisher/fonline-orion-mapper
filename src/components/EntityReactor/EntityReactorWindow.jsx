/**
 * Entity Reactor Window Component
 * Enhanced Proto Panel with WorldEditor semantic classification
 * Follows BaseWindow design pattern
 */

import React, { useState, useEffect, useMemo } from 'react';
import BaseWindow from '../../ui/BaseWindow.jsx';
import { Search, Filter, Tag, FileText, Image, FileCode, Package, AlertTriangle } from 'lucide-react';

const EntityReactorWindow = ({ databaseManager, onProtoSelect, docked = false, onToggleDock = () => {} }) => {
  const [protos, setProtos] = useState([]);
  const [selectedProto, setSelectedProto] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showValidation, setShowValidation] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // table, cards, detailed
  const [sortBy, setSortBy] = useState('pid');
  const [sortOrder, setSortOrder] = useState('asc');

  // WorldEditor categories
  const worldEditorCategories = {
    creatures: ['aliens', 'brahmins', 'deathclaws', 'dogs', 'geckos', 'ghouls', 'insects', 'mutants', 'plants', 'radscorpions', 'rats', 'robots', 'bandits', 'citizens', 'guards', 'merchants', 'slavers', 'slaves', 'tribals', 'vips', 'companions', 'strangers'],
    items: ['weapons', 'armor', 'ammunition', 'medicine', 'food', 'tools', 'containers', 'keys', 'books', 'misc']
  };

  // Load protos from database
  useEffect(() => {
    loadProtos();
  }, []);

  const loadProtos = async () => {
    try {
      const entities = await databaseManager.getAllEntities();
      setProtos(entities);
    } catch (error) {
      console.error('Failed to load protos:', error);
    }
  };

  // Filter and sort protos
  const filteredProtos = useMemo(() => {
    let filtered = protos;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(proto => 
        (proto.name?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        proto.proto_id?.toString().includes(searchTerm) ||
        (proto.properties?.Name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(proto => 
        proto.worldEditorCategory?.category === selectedCategory
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(proto => 
        proto.classification?.primary_class === selectedType
      );
    }

    // Validation filter
    if (showValidation) {
      filtered = filtered.filter(proto => 
        proto.validation_issues && proto.validation_issues.length > 0
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'pid':
          aValue = a.proto_id || 0;
          bValue = b.proto_id || 0;
          break;
        case 'name':
          aValue = a.name?.name || '';
          bValue = b.name?.name || '';
          break;
        case 'type':
          aValue = a.classification?.primary_class || '';
          bValue = b.classification?.primary_class || '';
          break;
        case 'category':
          aValue = a.worldEditorCategory?.category || '';
          bValue = b.worldEditorCategory?.category || '';
          break;
        default:
          aValue = a.proto_id || 0;
          bValue = b.proto_id || 0;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
    });

    return filtered;
  }, [protos, searchTerm, selectedCategory, selectedType, showValidation, sortBy, sortOrder]);

  // Handle proto selection
  const handleProtoSelect = (proto) => {
    setSelectedProto(proto);
    if (onProtoSelect) {
      onProtoSelect(proto);
    }
  };

  // Get statistics
  const statistics = useMemo(() => {
    const stats = {
      total: protos.length,
      creatures: protos.filter(p => p.classification?.primary_class === 'Critter').length,
      items: protos.filter(p => p.classification?.primary_class === 'Item').length,
      scenery: protos.filter(p => p.classification?.primary_class === 'Scenery').length,
      functional: protos.filter(p => p.classification?.primary_class === 'Functional').length,
      withIssues: protos.filter(p => p.validation_issues && p.validation_issues.length > 0).length
    };

    // Count WorldEditor categories
    Object.keys(worldEditorCategories).forEach(type => {
      worldEditorCategories[type].forEach(category => {
        const key = `${type}_${category}`;
        stats[key] = protos.filter(p => p.worldEditorCategory?.category === category).length;
      });
    });

    return stats;
  }, [protos]);

  const renderContent = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a1a', color: 'white' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #333', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package className="w-6 h-6" />
            Entity Reactor
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setShowValidation(!showValidation)}
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                backgroundColor: showValidation ? '#dc2626' : '#374151',
                border: 'none',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              <AlertTriangle className="w-4 h-4" />
              Issues ({statistics.withIssues})
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by name, PID, or properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: '16px',
                padding: '8px',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                color: 'white',
                outline: 'none'
              }}
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              color: 'white',
              outline: 'none'
            }}
          >
            <option value="all">All Categories</option>
            <optgroup label="Creatures">
              {worldEditorCategories.creatures.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </optgroup>
            <optgroup label="Items">
              {worldEditorCategories.items.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </optgroup>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              color: 'white',
              outline: 'none'
            }}
          >
            <option value="all">All Types</option>
            <option value="Critter">Critters</option>
            <option value="Item">Items</option>
            <option value="Scenery">Scenery</option>
            <option value="Functional">Functional</option>
          </select>
        </div>

        {/* View Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            Showing {filteredProtos.length} of {protos.length} protos
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '4px 12px',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                outline: 'none'
              }}
            >
              <option value="pid">Sort by PID</option>
              <option value="name">Sort by Name</option>
              <option value="type">Sort by Type</option>
              <option value="category">Sort by Category</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={{
                padding: '4px 12px',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
            
            <div style={{ display: 'flex', backgroundColor: '#374151', border: '1px solid #4b5563', borderRadius: '4px' }}>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  backgroundColor: viewMode === 'table' ? '#2563eb' : 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  backgroundColor: viewMode === 'cards' ? '#2563eb' : 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  backgroundColor: viewMode === 'detailed' ? '#2563eb' : 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Detailed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Proto List */}
        <div style={{ width: selectedProto ? '50%' : '100%', borderRight: selectedProto ? '1px solid #333' : 'none', overflow: 'auto' }}>
          {viewMode === 'table' && <TableView protos={filteredProtos} onSelect={handleProtoSelect} selected={selectedProto} />}
          {viewMode === 'cards' && <CardsView protos={filteredProtos} onSelect={handleProtoSelect} selected={selectedProto} />}
          {viewMode === 'detailed' && <DetailedView protos={filteredProtos} onSelect={handleProtoSelect} selected={selectedProto} />}
        </div>

        {/* Proto Details Panel */}
        {selectedProto && (
          <div style={{ width: '50%', overflow: 'auto' }}>
            <EntityDetails 
              proto={selectedProto} 
              onClose={() => setSelectedProto(null)}
              databaseManager={databaseManager}
            />
          </div>
        )}
      </div>

      {/* Statistics Footer */}
      <div style={{ borderTop: '1px solid #333', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>Total: {statistics.total}</span>
            <span>Critters: {statistics.creatures}</span>
            <span>Items: {statistics.items}</span>
            <span>Scenery: {statistics.scenery}</span>
            <span>Functional: {statistics.functional}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af' }}>
            <FileText className="w-4 h-4" />
            <span>FOnline Entity Reactor v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <BaseWindow
      title="Entity Reactor"
      docked={docked}
      onToggleDock={onToggleDock}
      defaultPosition={{ x: 100, y: 100 }}
      defaultSize={{ width: 1000, height: 700 }}
      showActions={true}
      count={statistics.total}
    >
      {renderContent()}
    </BaseWindow>
  );
};

// Table View Component
const TableView = ({ protos, onSelect, selected }) => {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead style={{ backgroundColor: '#374151', position: 'sticky', top: 0 }}>
        <tr>
          <th style={{ padding: '8px 16px', textAlign: 'left', borderBottom: '1px solid #4b5563' }}>PID</th>
          <th style={{ padding: '8px 16px', textAlign: 'left', borderBottom: '1px solid #4b5563' }}>Name</th>
          <th style={{ padding: '8px 16px', textAlign: 'left', borderBottom: '1px solid #4b5563' }}>Type</th>
          <th style={{ padding: '8px 16px', textAlign: 'left', borderBottom: '1px solid #4b5563' }}>Category</th>
          <th style={{ padding: '8px 16px', textAlign: 'left', borderBottom: '1px solid #4b5563' }}>File</th>
          <th style={{ padding: '8px 16px', textAlign: 'left', borderBottom: '1px solid #4b5563' }}>Issues</th>
        </tr>
      </thead>
      <tbody>
        {protos.filter(proto => proto && proto.proto_id != null).map((proto) => {
          const isSelected = selected?.proto_id === proto.proto_id;
          return (
            <tr
              key={`proto-${proto.proto_id}`}
              onClick={() => onSelect(proto)}
              style={{
                borderBottom: '1px solid #4b5563',
                cursor: 'pointer',
                backgroundColor: isSelected ? '#1e40af' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#374151';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <td style={{ padding: '8px 16px' }}>{proto.proto_id}</td>
              <td style={{ padding: '8px 16px' }}>{proto.name?.name || 'Unknown'}</td>
              <td style={{ padding: '8px 16px' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  backgroundColor: proto.classification?.primary_class === 'Critter' ? '#166534' :
                  proto.classification?.primary_class === 'Item' ? '#1e40af' :
                  proto.classification?.primary_class === 'Scenery' ? '#374151' :
                  '#6b21a8'
                }}>
                  {proto.classification?.primary_class || 'Unknown'}
                </span>
              </td>
              <td style={{ padding: '8px 16px' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                  {proto.worldEditorCategory?.category || 'unknown'}
                </span>
              </td>
              <td style={{ padding: '8px 16px', fontSize: '10px', color: '#6b7280' }}>
                {proto.source_file ? proto.source_file.split('/').pop() : 'N/A'}
              </td>
              <td style={{ padding: '8px 16px' }}>
                {proto.validation_issues && proto.validation_issues.length > 0 && (
                  <AlertTriangle className="w-4 h-4" />
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

// Cards View Component
const CardsView = ({ protos, onSelect, selected }) => {
  return (
    <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
      {protos.filter(proto => proto && proto.proto_id != null).map((proto) => (
        <div
          key={proto.proto_id}
          onClick={() => onSelect(proto)}
          style={{
            backgroundColor: '#374151',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            border: selected?.proto_id === proto.proto_id ? '1px solid #3b82f6' : '1px solid #4b5563'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#374151'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold' }}>PID {proto.proto_id}</span>
            {proto.validation_issues && proto.validation_issues.length > 0 && (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'medium', marginBottom: '4px' }}>
            {proto.name?.name || 'Unknown Entity'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: '#9ca3af' }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: proto.classification?.primary_class === 'Critter' ? '#166534' :
              proto.classification?.primary_class === 'Item' ? '#1e40af' :
              proto.classification?.primary_class === 'Scenery' ? '#374151' :
              '#6b21a8'
            }}>
              {proto.classification?.primary_class || 'Unknown'}
            </span>
            <span>{proto.worldEditorCategory?.category || 'unknown'}</span>
          </div>
          {proto.properties?.PicMap && (
            <div style={{ marginTop: '8px', fontSize: '10px', color: '#6b7280' }}>
              🖼️ {proto.properties.PicMap}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Detailed View Component
const DetailedView = ({ protos, onSelect, selected }) => {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {protos.filter(proto => proto && proto.proto_id != null).map((proto) => (
        <div
          key={proto.proto_id}
          onClick={() => onSelect(proto)}
          style={{
            backgroundColor: '#374151',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            border: selected?.proto_id === proto.proto_id ? '1px solid #3b82f6' : '1px solid #4b5563'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#374151'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>PID {proto.proto_id}</h3>
            <p style={{ color: '#d1d5db', margin: 0 }}>{proto.name?.name || 'Unknown Entity'}</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
            <div>
              <span style={{ color: '#9ca3af' }}>Category:</span>
              <span style={{ marginLeft: '8px' }}>{proto.worldEditorCategory?.category || 'unknown'}</span>
            </div>
            <div>
              <span style={{ color: '#9ca3af' }}>Confidence:</span>
              <span style={{ marginLeft: '8px' }}>{Math.round((proto.worldEditorCategory?.confidence || 0) * 100)}%</span>
            </div>
            <div>
              <span style={{ color: '#9ca3af' }}>Source:</span>
              <span style={{ marginLeft: '8px', fontSize: '12px' }}>{proto.source_file ? proto.source_file.split('/').pop() : 'N/A'}</span>
            </div>
            <div>
              <span style={{ color: '#9ca3af' }}>Script:</span>
              <span style={{ marginLeft: '8px', fontSize: '12px' }}>{proto.properties?.ScriptName || 'None'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Entity Details Component (simplified version)
const EntityDetails = ({ proto, onClose, databaseManager }) => {
  if (!proto) return null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a1a', color: 'white' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #333', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Entity Details</h2>
          <button
            onClick={onClose}
            style={{
              padding: '4px 8px',
              backgroundColor: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>General Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>PID</label>
              <div style={{ backgroundColor: '#374151', padding: '8px 12px', borderRadius: '4px' }}>
                {proto.proto_id}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Type</label>
              <div style={{ backgroundColor: '#374151', padding: '8px 12px', borderRadius: '4px' }}>
                {proto.classification?.primary_class || 'Unknown'}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Name</label>
            <div style={{ backgroundColor: '#374151', padding: '8px 12px', borderRadius: '4px' }}>
              {proto.name?.name || 'Unknown Entity'}
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Description</label>
            <div style={{ backgroundColor: '#374151', padding: '8px 12px', borderRadius: '4px', minHeight: '60px' }}>
              {proto.properties?.Description || 'No description available'}
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Properties</h3>
          <div style={{ backgroundColor: '#374151', borderRadius: '8px', padding: '16px' }}>
            {/* Image Preview */}
            {proto.properties?.PicMapName && (
              <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                <img
                  src={`./data/art/${proto.properties.PicMapName.replace(/\\/g, '/').replace(/\.[^.]*$/, '')}.png`}
                  alt={proto.name?.name || 'Entity'}
                  style={{
                    maxWidth: '150px',
                    maxHeight: '150px',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    backgroundColor: '#111827'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
                  {proto.properties.PicMapName}
                </div>
              </div>
            )}
            
            {proto.properties && Object.keys(proto.properties).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflow: 'auto' }}>
                {Object.entries(proto.properties).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #4b5563' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{key}</span>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280', fontSize: '12px' }}>No properties found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityReactorWindow;
