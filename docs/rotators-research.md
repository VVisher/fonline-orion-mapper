# Rotators SDK Research & Hybrid Architecture Plan

**Purpose**: Document findings from Rotators SDK research and plan hybrid architecture for ORION mapper  
**Created**: 2026-02-11  
**Scope**: WorldEditor analysis and hybrid integration strategy

---

## 🎯 **Hybrid Architecture Decision**

### **✅ Keep React Frontend**
- **Better UX** - Modern, responsive interface
- **Web-based** - Cross-platform compatibility
- **Component system** - Modular, maintainable
- **Performance** - Optimized for large datasets

### **✅ Study C# Backend Concepts**
- **Data parsing strategies** - Proven FOnline data handling
- **Entity classification** - Advanced heuristics and patterns
- **Database schemas** - Optimized for FOnline data structures
- **Script integration** - Smart object system reference

### **❌ Avoid Language Proliferation**
- **Single language frontend** (JavaScript/React)
- **Study concepts, not copy code** - Extract patterns, not implementations
- **Adapt proven strategies** - Translate C# patterns to JavaScript

---

## 🚀 **WorldEditor Key Findings**

### **📚 Capabilities**
- **"Parses almost all serverside gamedata"** - Exactly what we need!
- **C# scripting engine** - Full .NET library access
- **Internal API exposure** - Direct FOnline structure access
- **Extension system** - Proven plugin architecture
- **LINQ queries** - Advanced data manipulation

### **🔧 Technical Architecture**
```csharp
// WorldEditor Structure
WorldEditor/
├── WorldEditor.cfg      // Installation config
├── WorldEditor.user.cfg  // User preferences
├── scripts/              // Extension examples
├── docs/                 // API documentation
└── C# Script Engine      // CS-Script (CSScript.net)
```

### **💡 Key Insights**
- **"No in-depth knowledge required"** - User-friendly approach
- **"Scriptable extensions"** - Template for our smart objects
- **"Internal API exposure"** - Direct data structure access
- **"LINQ queries"** - Advanced data filtering/manipulation

---

## 🎭 **Data Parsing Strategy Analysis**

### **📊 What WorldEditor Parses**
- **Proto files** (.fopro) - Entity definitions
- **Script files** (.fos) - Game logic and defines
- **MSG files** - Text strings and descriptions
- **Configuration files** - World generation, locations
- **Map data** - Tile and object placement

### **🔍 Classification Approach**
```csharp
// Likely WorldEditor Pattern (to study)
class EntityParser {
    ParseProtoFiles() -> Entity[]
    CrossReferenceScripts() -> Relationships[]
    ExtractTextStrings() -> LocalizedStrings[]
    ValidateIntegrity() -> ValidationReport[]
}
```

### **🎯 Heuristic Detection**
```csharp
// Probable Classification Logic
if (entity.Type == ItemType) {
    if (entity.Flags & Usable) category = "Usable Item";
    if (entity.Flags & Takeable) category = "Takeable Item";
    if (entity.ScriptName.Contains("weapon")) category = "Weapon";
}
```

---

## 🔄 **Hybrid Integration Plan**

### **Phase 1: Research & Analysis**
- [ ] **Download WorldEditor source** from rotators/fo2238
- [ ] **Study entity parsing** code patterns
- [ ] **Analyze classification** heuristics
- [ ] **Document data structures** and schemas

### **Phase 2: Pattern Extraction**
- [ ] **Extract parsing strategies** from C# code
- [ ] **Translate classification rules** to JavaScript
- [ ] **Adapt database schemas** to our SQLite structure
- [ ] **Study script integration** patterns

### **Phase 3: Implementation**
- [ ] **Implement enhanced parsing** based on WorldEditor patterns
- [ ] **Add advanced classification** heuristics
- [ ] **Integrate script detection** system
- [ ] **Optimize database queries** with learned patterns

---

## 📋 **Research Tasks**

### **🔍 WorldEditor Source Analysis**
- [ ] **Locate WorldEditor source code** in rotators/fo2238
- [ ] **Find entity parsing classes** and methods
- [ ] **Study classification logic** and heuristics
- [ ] **Analyze database structures** and schemas

### **🎯 Pattern Extraction**
- [ ] **Document parsing workflow** step-by-step
- [ ] **Extract classification rules** and decision trees
- [ ] **Study script integration** approach
- [ ] **Analyze performance optimization** techniques

### **🔄 JavaScript Translation**
- [ ] **Convert C# patterns** to JavaScript equivalents
- [ ] **Adapt LINQ queries** to JavaScript/SQL
- [ ] **Translate classification logic** to our system
- [ **Implement similar extension system** for smart objects

---

## 🎼 **Integration with Parsing Movement**

### **Movement I: Prelude - Enhanced Configuration**
- [ ] **Study WorldEditor.cfg** structure
- [ ] **Adapt configuration patterns** to our aop-nightmare.cfg
- [ ] **Implement smart path detection** like WorldEditor

### **Movement II: Allegro - Advanced Proto Processing**
- [ ] **Study WorldEditor proto parsing** algorithms
- [ ] **Implement enhanced classification** heuristics
- [ ] **Add cross-reference validation** patterns

### **Movement III: Andante - Script Integration**
- [ ] **Analyze WorldEditor script parsing** approach
- [ ] **Implement similar script detection** system
- [ ] **Add smart object attachment** patterns

---

## 🎯 **Success Metrics**

### **Research Phase**
- ✅ **WorldEditor source code** analyzed and documented
- ✅ **Key parsing patterns** extracted and understood
- ✅ **Classification heuristics** translated to JavaScript
- ✅ **Database schemas** optimized based on findings

### **Implementation Phase**
- ✅ **Enhanced parsing** implemented with WorldEditor patterns
- ✅ **Advanced classification** working with heuristics
- ✅ **Script integration** matching WorldEditor capabilities
- ✅ **Performance optimized** using learned techniques

---

## 🚀 **Next Steps**

### **Immediate Action**
1. **Locate WorldEditor source** in rotators/fo2238 repository
2. **Study entity parsing** classes and methods
3. **Document classification** heuristics and rules
4. **Extract database schemas** and optimization patterns

### **Medium Term**
1. **Implement enhanced parsing** based on research
2. **Add advanced classification** to our database guide
3. **Integrate script detection** into parsing movement
4. **Optimize performance** using learned techniques

### **Long Term**
1. **Create universal parser** based on WorldEditor patterns
2. **Implement extension system** for custom server support
3. **Add advanced validation** and integrity checking
4. **Optimize for large datasets** using proven strategies

---

## 📝 **Research Notes**

### **Key WorldEditor Features to Study:**
- **Entity parsing algorithms** - How they handle .fopro files
- **Classification heuristics** - Decision trees for entity types
- **Script integration** - How they link entities to scripts
- **Database optimization** - Performance techniques for large datasets
- **Extension system** - Plugin architecture for custom features

### **Translation Strategy:**
- **Study concepts, not copy code** - Extract patterns and logic
- **Adapt to JavaScript** - Translate C# patterns to JS equivalents
- **Maintain React frontend** - Keep our modern UI approach
- **Optimize for web** - Adapt desktop patterns to web environment

---

*This research will significantly accelerate our parsing movement implementation by leveraging proven solutions from the FOnline community.*
