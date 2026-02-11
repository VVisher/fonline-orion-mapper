# Object Editor Design Document

## Overview

The Object Editor is an enhanced Proto Panel that provides comprehensive management of FOnline game objects (protos) with WorldEditor semantic classification, advanced filtering, and seamless mapper integration.

## Architecture

### Core Components

1. **ObjectEditor.jsx** - Main component with table/cards/detailed views
2. **ProtoDetails.jsx** - Detailed information panel with tabs
3. **ObjectEditorIntegration.jsx** - Integration layer for embedding and floating windows

### Key Features

#### 1. Unified Data View
- **Table View**: Classic spreadsheet-like interface with sortable columns
- **Cards View**: Visual card layout for quick browsing
- **Detailed View**: Rich information display with classification reasoning

#### 2. Advanced Filtering & Search
- **Real-time Search**: Filter by name, PID, or properties
- **WorldEditor Categories**: Filter by semantic categories (aliens, weapons, etc.)
- **Type Filtering**: Filter by primary class (Critter, Item, Scenery, Functional)
- **Validation Filter**: Show only items with issues
- **Multi-criteria Support**: Combine multiple filters

#### 3. WorldEditor Semantic Classification
- **22 Creature Categories**: aliens, brahmins, deathclaws, dogs, geckos, ghouls, insects, mutants, plants, radscorpions, rats, robots, bandits, citizens, guards, merchants, slavers, slaves, tribals, vips, companions, strangers
- **10 Item Categories**: weapons, armor, ammunition, medicine, food, tools, containers, keys, books, misc
- **Confidence Scoring**: Visual indication of classification confidence
- **Reasoning Display**: Shows why an entity was classified a certain way

#### 4. Detailed Property Editor
- **General Tab**: Basic information (PID, Name, Description)
- **Properties Tab**: All proto properties with type indicators
- **Classification Tab**: WorldEditor categories and behavior analysis
- **Assets Tab**: Visual assets and script information
- **Validation Tab**: Issues and processing information

#### 5. Visual Asset Integration
- **Ground Pictures**: Display PicMap properties
- **Inventory Pictures**: Display PicInv properties
- **Asset Preview**: Future support for .fofm file preview
- **Script Links**: Direct links to associated scripts

#### 6. Validation & Error Checking
- **Real-time Validation**: Highlight issues in the UI
- **Issue Categories**: Duplicate filenames, missing extensions, category mismatches
- **Validation Reports**: Detailed issue descriptions
- **Quick Fixes**: Suggestions for common problems

#### 7. Mapper Integration
- **Drag & Drop**: Drag protos directly into the mapper
- **Proto Selection**: Select protos from mapper to view details
- **Bidirectional Communication**: Seamless data flow between editor and mapper
- **Context Menu**: Right-click options for mapper integration

## Data Structure

### Proto Entity Structure
```javascript
{
  proto_id: Number,
  name: {
    name: String,
    source: String
  },
  properties: {
    // All proto properties from .fopro file
    Name: String,
    Description: String,
    ScriptName: String,
    PicMap: String,
    PicInv: String,
    // ... other properties
  },
  classification: {
    primary_class: String, // Critter, Item, Scenery, Functional
    subclass: String,
    confidence: String,   // high, medium, low
    conflicts: Array
  },
  worldEditorCategory: {
    category: String,     // WorldEditor semantic category
    confidence: Number,   // 0.0 - 1.0
    matched_keyword: String,
    traits: Array,
    reasoning: Array
  },
  traits: Array,          // Extracted traits (strong, hostile, etc.)
  behavior: {             // For creatures
    hostility: String,
    intelligence: String,
    social: String,
    combat_style: String
  },
  compatibility: {        // Player/NPC compatibility
    player_friendly: Boolean,
    npc_friendly: Boolean,
    faction_neutral: Boolean,
    trade_possible: Boolean,
    companion_possible: Boolean
  },
  validation_issues: Array,
  processing: {
    source_file: String,
    processed_at: String,
    confidence: Number
  }
}
```

## Integration Points

### 1. Database Integration
- **ProtoDatabaseManager**: Primary data source
- **EntityRepository**: LINQ-style queries
- **Real-time Updates**: Live data synchronization

### 2. Mapper Integration
- **Drag & Drop API**: HTML5 drag and drop events
- **Event System**: Custom events for proto selection
- **State Management**: Shared state between components

### 3. Script Integration
- **Script Parser**: Parse script references
- **Function Signatures**: Validate script parameters
- **Code Navigation**: Jump to script definitions

## UI/UX Design

### Design Principles
1. **Information Hierarchy**: Most important information first
2. **Visual Feedback**: Clear indicators for status and actions
3. **Efficient Navigation**: Quick access to common tasks
4. **Consistent Styling**: Follow existing design system

### Color Coding
- **Critters**: Green accents
- **Items**: Blue accents  
- **Scenery**: Gray accents
- **Functional**: Purple accents
- **Validation Issues**: Red accents
- **High Confidence**: Bright colors
- **Low Confidence**: Muted colors

### Responsive Design
- **Flexible Layouts**: Adapt to different screen sizes
- **Scrollable Areas**: Efficient use of space
- **Resizable Panels**: User can adjust panel sizes

## Performance Considerations

### Optimization Strategies
1. **Virtual Scrolling**: Handle large proto lists efficiently
2. **Lazy Loading**: Load details on demand
3. **Caching**: Cache classification results
4. **Debounced Search**: Reduce search overhead

### Memory Management
- **Component Cleanup**: Proper unmounting
- **Event Listeners**: Remove unused listeners
- **Large Objects**: Handle large proto data efficiently

## Future Enhancements

### Phase 1: Core Features
- [x] Basic proto listing and filtering
- [x] WorldEditor classification display
- [x] Detailed property view
- [x] Validation highlighting

### Phase 2: Advanced Features
- [ ] Visual asset preview (.fofm files)
- [ ] Script editor integration
- [ ] Batch operations
- [ ] Export/import functionality

### Phase 3: Expert Features
- [ ] Custom category creation
- [ ] Advanced query builder
- [ ] Plugin system
- [ ] Collaboration features

## Technical Implementation

### Dependencies
- React 18+ with hooks
- Lucide React for icons
- Tailwind CSS for styling
- Modern JavaScript (ES2022+)

### File Structure
```
src/components/ObjectEditor/
├── ObjectEditor.jsx              # Main component
├── ProtoDetails.jsx              # Details panel
├── ObjectEditorIntegration.jsx   # Integration layer
├── hooks/
│   ├── useObjectEditor.js        # State management hook
│   └── useProtoFilter.js         # Filtering logic
├── components/
│   ├── TableView.jsx             # Table view component
│   ├── CardsView.jsx             # Cards view component
│   ├── DetailedView.jsx          # Detailed view component
│   └── FilterPanel.jsx           # Filter controls
└── styles/
    └── ObjectEditor.module.css   # Component styles
```

### Testing Strategy
- **Unit Tests**: Component logic and utilities
- **Integration Tests**: Database and mapper integration
- **E2E Tests**: User workflows
- **Performance Tests**: Large dataset handling

## Usage Examples

### Basic Usage
```jsx
import ObjectEditor from './components/ObjectEditor/ObjectEditor.jsx';

function App() {
  const [databaseManager] = useState(new ProtoDatabaseManager());
  
  return (
    <ObjectEditor 
      databaseManager={databaseManager}
      onProtoSelect={(proto) => console.log('Selected:', proto)}
    />
  );
}
```

### Embedded Mode
```jsx
<ObjectEditor 
  databaseManager={databaseManager}
  isEmbedded={true}
  onProtoSelect={handleProtoSelection}
/>
```

### Floating Window Mode
```jsx
<ObjectEditorIntegration
  databaseManager={databaseManager}
  onProtoSelect={handleProtoSelection}
  onProtoDragStart={handleDragToMapper}
  initialPosition={{ x: 100, y: 100 }}
  initialSize={{ width: 800, height: 600 }}
/>
```

## Conclusion

The Object Editor provides a comprehensive solution for managing FOnline protos with modern UI/UX design, WorldEditor semantic classification, and seamless mapper integration. It enhances the existing Proto Panel with advanced features while maintaining simplicity and performance.
