/**
 * Proto Details Panel Component
 * Shows detailed information about selected proto
 */

import React, { useState } from 'react';
import { X, Edit, Save, Image, FileCode, Tag, AlertTriangle, Copy, ExternalLink, FileText } from 'lucide-react';

const ProtoDetails = ({ proto, onClose, databaseManager }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProto, setEditedProto] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  if (!proto) return null;

  const handleEdit = () => {
    setEditedProto({ ...proto });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await databaseManager.updateEntity(editedProto);
      setIsEditing(false);
      // Refresh proto data
      const updatedProto = await databaseManager.getEntity(proto.proto_id);
      Object.assign(proto, updatedProto);
    } catch (error) {
      console.error('Failed to save proto:', error);
    }
  };

  const handleCancel = () => {
    setEditedProto(null);
    setIsEditing(false);
  };

  const renderGeneralTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">PID</label>
          <div className="bg-gray-800 px-3 py-2 rounded">
            {proto.proto_id}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
          <div className="bg-gray-800 px-3 py-2 rounded">
            {proto.classification?.primary_class || 'Unknown'}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
        {isEditing ? (
          <input
            type="text"
            value={editedProto.name?.name || ''}
            onChange={(e) => setEditedProto({
              ...editedProto,
              name: { ...editedProto.name, name: e.target.value }
            })}
            className="w-full bg-gray-800 px-3 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
        ) : (
          <div className="bg-gray-800 px-3 py-2 rounded">
            {proto.name?.name || 'Unknown Entity'}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
        {isEditing ? (
          <textarea
            value={editedProto.properties?.Description || ''}
            onChange={(e) => setEditedProto({
              ...editedProto,
              properties: { ...editedProto.properties, Description: e.target.value }
            })}
            className="w-full bg-gray-800 px-3 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none h-20"
          />
        ) : (
          <div className="bg-gray-800 px-3 py-2 rounded min-h-[3rem]">
            {proto.properties?.Description || 'No description available'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Proto File</label>
          <div className="bg-gray-800 px-3 py-2 rounded text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {proto.source_file ? proto.source_file.split('/').pop() : 'N/A'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Script</label>
          <div className="bg-gray-800 px-3 py-2 rounded text-sm flex items-center gap-2">
            <FileCode className="w-4 h-4" />
            {proto.properties?.ScriptName || 'None'}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPropertiesTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Properties
        </h3>
        <div className="space-y-2 max-h-96 overflow-auto">
          {proto.properties && Object.keys(proto.properties).length > 0 ? (
            Object.entries(proto.properties).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center py-1 border-b border-gray-700">
                <span className="text-sm text-gray-400">{key}</span>
                <span className="text-sm font-mono">{String(value)}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No properties found</p>
          )}
        </div>
      </div>

      {proto.traits && proto.traits.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Traits
          </h3>
          <div className="flex flex-wrap gap-2">
            {proto.traits.map((trait, index) => (
              <span key={index} className="px-2 py-1 bg-blue-800 rounded text-xs">
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderClassificationTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="font-medium mb-3">WorldEditor Classification</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
            <div className="bg-gray-900 px-3 py-2 rounded">
              {proto.worldEditorCategory?.category || 'unknown'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Confidence</label>
            <div className="bg-gray-900 px-3 py-2 rounded">
              {Math.round((proto.worldEditorCategory?.confidence || 0) * 100)}%
            </div>
          </div>
        </div>

        {proto.worldEditorCategory?.reasoning && proto.worldEditorCategory.reasoning.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Reasoning</label>
            <ul className="space-y-1">
              {proto.worldEditorCategory.reasoning.map((reason, index) => (
                <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {proto.behavior && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-medium mb-3">Behavior Analysis</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Hostility</label>
              <div className="bg-gray-900 px-3 py-2 rounded capitalize">
                {proto.behavior.hostility}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Intelligence</label>
              <div className="bg-gray-900 px-3 py-2 rounded capitalize">
                {proto.behavior.intelligence}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Social</label>
              <div className="bg-gray-900 px-3 py-2 rounded capitalize">
                {proto.behavior.social}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Combat Style</label>
              <div className="bg-gray-900 px-3 py-2 rounded capitalize">
                {proto.behavior.combat_style}
              </div>
            </div>
          </div>
        </div>
      )}

      {proto.compatibility && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-medium mb-3">Compatibility</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(proto.compatibility).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAssetsTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Image className="w-4 h-4" />
          Visual Assets
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Ground Picture</label>
            <div className="bg-gray-900 px-3 py-2 rounded text-sm font-mono flex items-center gap-2">
              <Image className="w-4 h-4" />
              {proto.properties?.PicMap || 'Not specified'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Inventory Picture</label>
            <div className="bg-gray-900 px-3 py-2 rounded text-sm font-mono flex items-center gap-2">
              <Image className="w-4 h-4" />
              {proto.properties?.PicInv || 'Not specified'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Interface Picture</label>
            <div className="bg-gray-900 px-3 py-2 rounded text-sm font-mono flex items-center gap-2">
              <Image className="w-4 h-4" />
              {proto.properties?.PicInterface || 'Not specified'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <FileCode className="w-4 h-4" />
          Script Information
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Script Name</label>
            <div className="bg-gray-900 px-3 py-2 rounded text-sm font-mono">
              {proto.properties?.ScriptName || 'None'}
            </div>
          </div>
          {proto.properties?.StartScript && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Start Script</label>
              <div className="bg-gray-900 px-3 py-2 rounded text-sm font-mono">
                {proto.properties.StartScript}
              </div>
            </div>
          )}
          {proto.properties?.FinishScript && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Finish Script</label>
              <div className="bg-gray-900 px-3 py-2 rounded text-sm font-mono">
                {proto.properties.FinishScript}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderValidationTab = () => (
    <div className="space-y-4">
      {proto.validation_issues && proto.validation_issues.length > 0 ? (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2 text-red-400">
            <Icons.AlertTriangle />
            Validation Issues ({proto.validation_issues.length})
          </h3>
          <div className="space-y-2">
            {proto.validation_issues.map((issue, index) => (
              <div key={index} className="bg-gray-800 rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-1 bg-red-800 rounded text-xs">
                    {issue.type}
                  </span>
                  <span className="text-sm text-gray-400">
                    {issue.filename || `PID ${proto.proto_id}`}
                  </span>
                </div>
                <p className="text-sm">{issue.message}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
          <h3 className="font-medium mb-2 text-green-400">✓ No Validation Issues</h3>
          <p className="text-sm text-gray-300">
            This proto passes all validation checks.
          </p>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="font-medium mb-3">Processing Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Processed at:</span>
            <span>{proto.processing?.processed_at || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Algorithm:</span>
            <span>{proto.processing?.algorithm || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Confidence:</span>
            <span>{Math.round((proto.processing?.confidence || 0) * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Proto Details</h2>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded flex items-center gap-1 text-sm"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-1 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(proto, null, 2))}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-1 text-sm"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-800 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {[
            { id: 'general', label: 'General', icon: 'Tag' },
            { id: 'properties', label: 'Properties', icon: 'Tag' },
            { id: 'classification', label: 'Classification', icon: 'Tag' },
            { id: 'assets', label: 'Assets', icon: 'Image' },
            { id: 'validation', label: 'Validation', icon: 'AlertTriangle' }
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-3 py-1 rounded flex items-center gap-1 text-sm ${
                activeTab === id ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {icon === 'Tag' && <Tag className="w-4 h-4" />}
              {icon === 'Image' && <Image className="w-4 h-4" />}
              {icon === 'AlertTriangle' && <AlertTriangle className="w-4 h-4" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'properties' && renderPropertiesTab()}
        {activeTab === 'classification' && renderClassificationTab()}
        {activeTab === 'assets' && renderAssetsTab()}
        {activeTab === 'validation' && renderValidationTab()}
      </div>
    </div>
  );
};

export default ProtoDetails;
