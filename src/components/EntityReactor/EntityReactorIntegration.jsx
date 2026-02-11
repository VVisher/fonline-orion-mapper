/**
 * Object Editor Integration Component
 * Integrates Object Editor with the main mapper application
 */

import React, { useState, useRef, useEffect } from 'react';
import ObjectEditor from './ObjectEditor.jsx';
import { Package, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';

const ObjectEditorIntegration = ({ 
  databaseManager, 
  onProtoSelect, 
  onProtoDragStart,
  isEmbedded = false,
  initialPosition = { x: 0, y: 0 },
  initialSize = { width: 800, height: 600 }
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Handle window dragging
  const handleMouseDown = (e) => {
    if (e.target.closest('.no-drag')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Handle proto selection with drag support
  const handleProtoSelect = (proto) => {
    if (onProtoSelect) {
      onProtoSelect(proto);
    }
  };

  // Handle drag start for mapper integration
  const handleDragStart = (proto, event) => {
    if (onProtoDragStart) {
      onProtoDragStart(proto, event);
    }
  };

  // Toggle maximize
  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (!isMaximized) {
      // Save current position and size
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight });
    } else {
      // Restore previous size
      setSize(initialSize);
    }
  };

  // Embedded mode (part of main UI)
  if (isEmbedded) {
    return (
      <div className="h-full flex flex-col">
        <ObjectEditor 
          databaseManager={databaseManager}
          onProtoSelect={handleProtoSelect}
        />
      </div>
    );
  }

  // Floating window mode
  return (
    <div
      ref={containerRef}
      className={`fixed bg-gray-900 border border-gray-700 rounded-lg shadow-2xl ${
        isVisible ? 'block' : 'hidden'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: 1000
      }}
    >
      {/* Title Bar */}
      <div
        className="bg-gray-800 border-b border-gray-700 px-4 py-2 rounded-t-lg cursor-move flex items-center justify-between"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-400" />
          <span className="font-medium">Object Editor</span>
        </div>
        
        <div className="flex items-center gap-1 no-drag">
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="p-1 hover:bg-gray-700 rounded no-drag"
            title={isVisible ? 'Hide' : 'Show'}
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleMaximize}
            className="p-1 hover:bg-gray-700 rounded no-drag"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-700 rounded no-drag"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-3rem)]">
        <ObjectEditor 
          databaseManager={databaseManager}
          onProtoSelect={handleProtoSelect}
        />
      </div>
    </div>
  );
};

// Hook for managing Object Editor state
export const useObjectEditor = (databaseManager) => {
  const [editorState, setEditorState] = useState({
    isOpen: false,
    isEmbedded: false,
    selectedProto: null,
    position: { x: 100, y: 100 },
    size: { width: 800, height: 600 }
  });

  const openEditor = (options = {}) => {
    setEditorState(prev => ({
      ...prev,
      isOpen: true,
      isEmbedded: options.embedded || false,
      position: options.position || prev.position,
      size: options.size || prev.size
    }));
  };

  const closeEditor = () => {
    setEditorState(prev => ({ ...prev, isOpen: false }));
  };

  const selectProto = (proto) => {
    setEditorState(prev => ({ ...prev, selectedProto: proto }));
  };

  const toggleEmbedded = () => {
    setEditorState(prev => ({ ...prev, isEmbedded: !prev.isEmbedded }));
  };

  return {
    ...editorState,
    openEditor,
    closeEditor,
    selectProto,
    toggleEmbedded
  };
};

// Context for Object Editor integration
export const ObjectEditorContext = React.createContext({
  databaseManager: null,
  selectedProto: null,
  onProtoSelect: () => {},
  onProtoDragStart: () => {}
});

// Provider component
export const ObjectEditorProvider = ({ children, databaseManager }) => {
  const [selectedProto, setSelectedProto] = useState(null);

  const handleProtoSelect = (proto) => {
    setSelectedProto(proto);
  };

  const handleProtoDragStart = (proto, event) => {
    // Set drag data for mapper integration
    event.dataTransfer.setData('application/x-fonline-proto', JSON.stringify({
      proto_id: proto.proto_id,
      name: proto.name?.name || 'Unknown',
      type: proto.classification?.primary_class,
      category: proto.worldEditorCategory?.category,
      properties: proto.properties
    }));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const contextValue = {
    databaseManager,
    selectedProto,
    onProtoSelect: handleProtoSelect,
    onProtoDragStart: handleProtoDragStart
  };

  return (
    <ObjectEditorContext.Provider value={contextValue}>
      {children}
    </ObjectEditorContext.Provider>
  );
};

// Higher-order component for Object Editor integration
export const withObjectEditor = (WrappedComponent) => {
  return function ObjectEditorWrapper(props) {
    const editorState = useObjectEditor(props.databaseManager);

    return (
      <>
        <WrappedComponent 
          {...props}
          objectEditor={editorState}
          openObjectEditor={editorState.openEditor}
          closeObjectEditor={editorState.closeEditor}
          selectProto={editorState.selectProto}
        />
        
        {editorState.isOpen && !editorState.isEmbedded && (
          <ObjectEditorIntegration
            databaseManager={props.databaseManager}
            onProtoSelect={editorState.selectProto}
            position={editorState.position}
            size={editorState.size}
          />
        )}
      </>
    );
  };
};

export default ObjectEditorIntegration;
