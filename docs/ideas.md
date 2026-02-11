# ORION Mapper - Future Ideas & Roadmap

## Current Phase: AoP Testing Period
**Focus**: Perfect the tools for FOnline: Ashes of Phoenix to ensure everything works properly before expanding.

---

## 🚀 Post-Testing Phase Ideas

### 🔄 Database Management System

#### **Dynamic Database Sync**
- **On-demand sync** with server files
- **Watch mode** - Auto-update when server files change
- **Incremental updates** - Only parse changed files
- **Version control** - Track database versions and rollback capability

#### **Database Operations**
- **Delete & Regenerate** - Clean slate option
- **Backup system** - Auto-backup before major changes
- **Export/Import** - Share databases between users
- **Validation** - Check database integrity against server

### 🗂️ Configuration Management

#### **Smart Path Detection**
- **Auto-discovery** - Search for standard FOnline folder structures
- **Same-root detection** - When mapper is in same folder as server/client
- **Fallback prompts** - Guided setup when auto-detection fails
- **Path validation** - Verify paths contain expected files

#### **User Configuration**
- **Profile system** - Multiple server configurations
- **Portable configs** - Export/import user settings
- **Default templates** - Common server setups
- **Custom paths** - Full control over file locations

### 🌐 Universal FOnline Support (Future)

#### **Server Profile System**
```javascript
// Example server profiles
{
  "ashes-of-phoenix": {
    "proto_format": "aop",
    "script_prefix": "PHX_",
    "special_features": ["dungeons", "crafting"]
  },
  "2238": {
    "proto_format": "classic", 
    "script_prefix": "",
    "special_features": ["extended_dialogs"]
  },
  "reloaded": {
    "proto_format": "enhanced",
    "script_prefix": "RL_",
    "special_features": ["new_skills"]
  }
}
```

#### **Adaptive Parsing**
- **Format detection** - Auto-detect proto file variations
- **Script mapping** - Dynamic script attachment based on patterns
- **Flexible smart objects** - Server-agnostic object templates
- **Plugin architecture** - Extensible server support

### 🔧 Advanced Features

#### **Real-time Collaboration**
- **Multi-user editing** - Multiple mappers working on same map
- **Conflict resolution** - Handle simultaneous edits
- **Cloud sync** - Share maps via cloud storage
- **Version history** - Track changes over time

#### **Server Integration**
- **Live preview** - See changes in real-time on running server
- **Hot reload** - Push maps directly to running server
- **Script testing** - Test scripts within mapper
- **Performance profiling** - Check map performance impact

#### **Enhanced Tooling**
- **AI assistance** - Suggest object placements based on context
- **Template library** - Community-shared map templates
- **Advanced PCG** - Procedural generation with custom rules
- **Import tools** - Convert maps from other editors

### 📱 User Experience

#### **Accessibility**
- **Beginner mode** - Simplified interface for new users
- **Advanced mode** - Full control for experienced mappers
- **Tutorials** - Interactive guided tours
- **Context help** - Hover tooltips and documentation

#### **Performance**
- **WebAssembly acceleration** - Heavy computations in WASM
- **GPU acceleration** - Use WebGL for rendering
- **Lazy loading** - Load only what's needed
- **Memory optimization** - Handle massive maps efficiently

### 🔮 Long-term Vision

#### **Ecosystem Integration**
- **Mod support** - Community-created extensions
- **Asset store** - Share/sell custom assets
- **Script marketplace** - Community scripts
- **Map sharing platform** - Community map library

#### **Professional Features**
- **Version control integration** - Git, SVN support
- **Team workflows** - Role-based permissions
- **CI/CD integration** - Automated testing/deployment
- **Analytics** - Map usage statistics

---

## 🎯 Implementation Priority

### **Phase 3.5** (After AoP Testing)
1. ✅ **Database management** - Sync, delete, regenerate
2. ✅ **Smart path detection** - Auto-discovery system
3. ✅ **User configuration** - Profile management

### **Phase 4** (Universal Support)
1. 🔄 **Server profile system** - Multi-server support
2. 🔄 **Adaptive parsing** - Format-agnostic parsing
3. 🔄 **Plugin architecture** - Extensible design

### **Phase 5** (Advanced Features)
1. ⚪ **Real-time collaboration** - Multi-user editing
2. ⚪ **Server integration** - Live preview and hot reload
3. ⚪ **AI assistance** - Smart suggestions

---

## 💡 Technical Considerations

### **Architecture Decisions**
- **Modular design** - Easy to extend for new servers
- **Plugin system** - Community contributions
- **Configuration-driven** - Minimal code changes for new servers
- **Backward compatibility** - Support older server versions

### **Performance Targets**
- **Large maps** - Handle 10MB+ maps without lag
- **Real-time editing** - Smooth 60 FPS interaction
- **Fast parsing** - Parse 10k+ entities in <30 seconds
- **Memory efficient** - <500MB RAM usage for large maps

### **User Experience Goals**
- **Zero configuration** - Works out of the box
- **Intuitive** - Learn basics in <10 minutes
- **Powerful** - Advanced features when needed
- **Reliable** - No data loss, crash-resistant

---

## 🤔 Community Questions

### **What do FOnline server admins need?**
- **Import tools** for existing maps?
- **Batch operations** for large changes?
- **Custom proto support** for unique items?
- **Integration** with existing workflows?

### **What features would make this indispensable?**
- **Live server integration**?
- **Collaboration tools**?
- **Advanced scripting support**?
- **Performance analysis**?

---

*This document evolves with community feedback and project progress. Last updated: 2026-02-11*
