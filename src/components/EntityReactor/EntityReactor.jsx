/**
 * FOnline Object Editor Component
 * Enhanced Proto Panel with WorldEditor semantic classification
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Tag, FileText, Image, FileCode, Package, AlertTriangle } from 'lucide-react';

const ObjectEditor = ({ databaseManager, onProtoSelect }) => {
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

  return (
    <div className="object-editor h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Object Editor
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowValidation(!showValidation)}
              className={`px-3 py-1 rounded flex items-center gap-1 text-sm ${
                showValidation ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Issues ({statistics.withIssues})
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by name, PID, or properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
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
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="Critter">Critters</option>
            <option value="Item">Items</option>
            <option value="Scenery">Scenery</option>
            <option value="Functional">Functional</option>
          </select>
        </div>

        {/* View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              Showing {filteredProtos.length} of {protos.length} protos
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="pid">Sort by PID</option>
              <option value="name">Sort by Name</option>
              <option value="type">Sort by Type</option>
              <option value="category">Sort by Category</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm hover:bg-gray-700"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
            
            <div className="flex bg-gray-800 border border-gray-700 rounded">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-sm ${viewMode === 'table' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 text-sm ${viewMode === 'cards' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1 text-sm ${viewMode === 'detailed' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              >
                Detailed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Proto List */}
        <div className={`${selectedProto ? 'w-1/2' : 'w-full'} border-r border-gray-700 overflow-auto`}>
          {viewMode === 'table' && <TableView protos={filteredProtos} onSelect={handleProtoSelect} selected={selectedProto} />}
          {viewMode === 'cards' && <CardsView protos={filteredProtos} onSelect={handleProtoSelect} selected={selectedProto} />}
          {viewMode === 'detailed' && <DetailedView protos={filteredProtos} onSelect={handleProtoSelect} selected={selectedProto} />}
        </div>

        {/* Proto Details Panel */}
        {selectedProto && (
          <div className="w-1/2 overflow-auto">
            <ProtoDetails 
              proto={selectedProto} 
              onClose={() => setSelectedProto(null)}
              databaseManager={databaseManager}
            />
          </div>
        )}
      </div>

      {/* Statistics Footer */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span>Total: {statistics.total}</span>
            <span>Critters: {statistics.creatures}</span>
            <span>Items: {statistics.items}</span>
            <span>Scenery: {statistics.scenery}</span>
            <span>Functional: {statistics.functional}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <FileText className="w-4 h-4" />
            <span>FOnline Object Editor v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Table View Component
const TableView = ({ protos, onSelect, selected }) => {
  return (
    <table className="w-full">
      <thead className="bg-gray-800 sticky top-0">
        <tr>
          <th className="px-4 py-2 text-left">PID</th>
          <th className="px-4 py-2 text-left">Name</th>
          <th className="px-4 py-2 text-left">Type</th>
          <th className="px-4 py-2 text-left">Category</th>
          <th className="px-4 py-2 text-left">File</th>
          <th className="px-4 py-2 text-left">Issues</th>
        </tr>
      </thead>
      <tbody>
        {protos.map((proto) => (
          <tr
            key={proto.proto_id}
            onClick={() => onSelect(proto)}
            className={`border-b border-gray-800 cursor-pointer hover:bg-gray-800 ${
              selected?.proto_id === proto.proto_id ? 'bg-blue-900' : ''
            }`}
          >
            <td className="px-4 py-2">{proto.proto_id}</td>
            <td className="px-4 py-2">{proto.name?.name || 'Unknown'}</td>
            <td className="px-4 py-2">
              <span className={`px-2 py-1 rounded text-xs ${
                proto.classification?.primary_class === 'Critter' ? 'bg-green-800' :
                proto.classification?.primary_class === 'Item' ? 'bg-blue-800' :
                proto.classification?.primary_class === 'Scenery' ? 'bg-gray-700' :
                'bg-purple-800'
              }`}>
                {proto.classification?.primary_class || 'Unknown'}
              </span>
            </td>
            <td className="px-4 py-2">
              <span className="text-xs text-gray-400">
                {proto.worldEditorCategory?.category || 'unknown'}
              </span>
            </td>
            <td className="px-4 py-2 text-xs text-gray-500">
              {proto.source_file ? proto.source_file.split('/').pop() : 'N/A'}
            </td>
            <td className="px-4 py-2">
              {proto.validation_issues && proto.validation_issues.length > 0 && (
                <AlertTriangle className="w-4 h-4" />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Cards View Component
const CardsView = ({ protos, onSelect, selected }) => {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {protos.map((proto) => (
        <div
          key={proto.proto_id}
          onClick={() => onSelect(proto)}
          className={`bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 border ${
            selected?.proto_id === proto.proto_id ? 'border-blue-500' : 'border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold">PID {proto.proto_id}</span>
            {proto.validation_issues && proto.validation_issues.length > 0 && (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>
          <div className="text-sm font-medium mb-1">
            {proto.name?.name || 'Unknown Entity'}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className={`px-2 py-1 rounded ${
              proto.classification?.primary_class === 'Critter' ? 'bg-green-800' :
              proto.classification?.primary_class === 'Item' ? 'bg-blue-800' :
              proto.classification?.primary_class === 'Scenery' ? 'bg-gray-700' :
              'bg-purple-800'
            }`}>
              {proto.classification?.primary_class || 'Unknown'}
            </span>
            <span>{proto.worldEditorCategory?.category || 'unknown'}</span>
          </div>
          {proto.properties?.PicMap && (
            <div className="mt-2 text-xs text-gray-500">
              �️ {proto.properties.PicMap}
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
    <div className="p-4 space-y-4">
      {protos.map((proto) => (
        <div
          key={proto.proto_id}
          onClick={() => onSelect(proto)}
          className={`bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 border ${
            selected?.proto_id === proto.proto_id ? 'border-blue-500' : 'border-gray-700'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg">PID {proto.proto_id}</h3>
              <p className="text-gray-300">{proto.name?.name || 'Unknown Entity'}</p>
            </div>
            <div className="flex items-center gap-2">
              {proto.validation_issues && proto.validation_issues.length > 0 && (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              <span className={`px-2 py-1 rounded text-xs ${
                proto.classification?.primary_class === 'Critter' ? 'bg-green-800' :
                proto.classification?.primary_class === 'Item' ? 'bg-blue-800' :
                proto.classification?.primary_class === 'Scenery' ? 'bg-gray-700' :
                'bg-purple-800'
              }`}>
                {proto.classification?.primary_class || 'Unknown'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Category:</span>
              <span className="ml-2">{proto.worldEditorCategory?.category || 'unknown'}</span>
            </div>
            <div>
              <span className="text-gray-400">Confidence:</span>
              <span className="ml-2">{Math.round((proto.worldEditorCategory?.confidence || 0) * 100)}%</span>
            </div>
            <div>
              <span className="text-gray-400">Source:</span>
              <span className="ml-2 text-xs">{proto.source_file ? proto.source_file.split('/').pop() : 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-400">Script:</span>
              <span className="ml-2 text-xs">{proto.properties?.ScriptName || 'None'}</span>
            </div>
          </div>
          
          {proto.worldEditorCategory?.reasoning && proto.worldEditorCategory.reasoning.length > 0 && (
            <div className="mt-3 text-xs text-gray-400">
              <div className="font-medium mb-1">Classification reasoning:</div>
              <ul className="list-disc list-inside">
                {proto.worldEditorCategory.reasoning.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ObjectEditor;
