# FOnline SDK & WorldEditor Reference

**Source**: Rotators SDK (FO2238)  
**Relevance**: Reference for FOnline: Ashes of Phoenix mapper development  
**Last Updated**: 2026-02-11

---

## 🎯 Overview

This document contains essential information from the Rotators FOnline SDK and WorldEditor that is relevant to our Project 412 Mapper development. The Rotators team has built comprehensive tools for FOnline that we can reference for best practices, file structures, and parsing approaches.

---

## 📁 WorldEditor File Structure Reference

### Standard FOnline Server Directory Layout
Based on WorldEditor.cfg, the canonical FOnline server structure:

```
Server/
├── text/
│   └── engl/
│       ├── FOGM.MSG          # Game messages
│       ├── FODLG.MSG         # Dialog messages  
│       ├── FOGAME.MSG        # Game system messages
│       └── FOOBJ.MSG         # Object names/descriptions
├── maps/
│   ├── Locations.cfg         # Location definitions
│   ├── Maps.cfg             # Map definitions
│   ├── GenerateWorld.cfg    # World generation config
│   ├── worldmap.focwm       # Compiled worldmap
│   ├── groups.fowm          # Map groups
│   └── [map files].fomap    # Individual map files
├── proto/
│   ├── critters/            # Critter prototype files
│   │   └── *.fopro
│   └── items/               # Item prototype files
│       ├── armor.fopro
│       ├── helmet.fopro
│       └── *.fopro
├── dialogs/
│   └── *.fodlg              # Dialog files
├── extensions/
│   └── [extension files]
├── data/
│   └── ParamNames.lst       # Parameter names
└── scripts/
    ├── _defines.fos         # Global defines
    ├── worldmap_h.fos       # Worldmap header
    ├── _maps.fos            # Maps header
    ├── ITEMPID.H            # Item PID definitions
    └── *.fos                # Script files
```

### Key Configuration Files

#### WorldEditor.cfg Structure
```ini
[Path]
Textdir              =..\..\Server\text\engl\
FOGM                 =..\..\Server\text\engl\FOGM.MSG
FODLG                =..\..\Server\text\engl\FODLG.MSG
FOGAME               =..\..\Server\text\engl\FOGAME.MSG
Mapsdir              =..\..\Server\maps\
Dialogsdir           =..\..\Server\dialogs\
ExtensionsDir        =..\..\Server\extensions\
CritterprotoDir      =..\..\Server\proto\critters\
ItemprotoDir         =..\..\Server\proto\items\
ArmorProtos          =..\..\Server\proto\items\armor.fopro
HelmetProtos         =..\..\Server\proto\items\helmet.fopro
DataDir              =..\..\Server\data\
ScriptsDir           =..\..\Server\scripts\
Defines              =..\..\Server\scripts\_defines.fos
WorldMapHeader       =..\..\Server\scripts\worldmap_h.fos
MapsHeader           =..\..\Server\scripts\_maps.fos
Itempid              =..\..\Server\scripts\ITEMPID.H
Locations            =..\..\Server\maps\Locations.cfg
Maps                 =..\..\Server\maps\Maps.cfg
GenerateWorld        =..\..\Server\maps\GenerateWorld.cfg
WorldMapFileCompiled =..\..\Server\maps\worldmap.focwm
Groups               =..\..\Server\maps\groups.fowm
ParamNames           =..\..\Server\data\ParamNames.lst
ProtoFiles           =2238 aliens brahmins deathclaws dogs geckos ghouls insects mutants plants radscorpions rats robots bandits citizens encounter guards merchants slavers slaves tribals vips 3d bounty companions strangers invalid
BaseProtoFiles       =invalid
TownGraphics         =graphics\
WorldMapFile         =worldmap.fowm
EditorScript         =scripts\
WorldMapPic          =graphics\worldmap.png

[Worldmap]
ZoneSize=25
Scale=100
```

---

## 🔧 FOCommon Library Reference

### Overview
FOCommon is a .NET library for interacting with FOnline SDK gamedata. It provides parsers and utilities for:
- Dialog parsing with multi-language support
- Critter proto parsing
- Item proto parsing  
- Fomap file reading
- Worldmap classes

### Key Features
- **Full dialog parsing**: Including demands/results, comments, multi-language support
- **Proto file parsers**: For both critters and items
- **Fomap reading**: Map file format support
- **Worldmap classes**: Worldmap data structures

### Dependencies
- .NET 2.0 framework

---

## 📂 File Format Specifications

### Dialog Files (.fodlg)
Based on FOCommon examples, dialog files contain:
- **Nodes**: Dialog conversation points
- **Answers**: Player response options
- **Demands**: Conditions for answers
- **Multi-language support**: Text trees per language
- **Comments**: Dialog metadata

#### Dialog Structure Example
```csharp
Dialog dialog = dialogParser.GetDialog();
Console.WriteLine("Dialog languages: " + String.Join(",", dialog.LanguageTrees.ToArray()));
Console.WriteLine("Comment: " + dialog.Comment);

foreach (Node node in dialog.Nodes)
{
    Console.WriteLine("[{0}] {1}", node.Id, node.Text["engl"]);
}
```

### Proto Files (.fopro)
Prototype files define game entities with:
- **Properties**: Entity attributes (Type, Flags, Stats, etc.)
- **Art assets**: Images and sprites
- **Script references**: Associated scripts
- **Classification**: Entity categories

### MSG Files (.MSG)
Message files contain localized strings:
- **FOGM.MSG**: Game messages
- **FODLG.MSG**: Dialog messages
- **FOGAME.MSG**: System messages  
- **FOOBJ.MSG**: Object names and descriptions
- **Format**: `{key}{value}` pairs

### Map Files (.fomap)
Map files contain:
- **Tile data**: Terrain information
- **Object placement**: Entity positions
- **Script zones**: Trigger areas
- **Header data**: Map metadata

---

## 🎮 WorldEditor Categories Reference

### Standard Proto Categories
From WorldEditor.cfg ProtoFiles setting:
```
ProtoFiles = 2238 aliens brahmins deathclaws dogs geckos ghouls insects 
            mutants plants radscorpions rats robots bandits citizens 
            encounter guards merchants slavers slaves tribals vips 
            3d bounty companions strangers invalid
```

### Critter Categories
- **aliens**: Extraterrestrial creatures
- **brahmins**: Two-headed cattle
- **deathclaws**: Powerful predators
- **dogs**: Canine companions
- **geckos**: Reptilian creatures
- **ghouls**: Mutated humans
- **insects**: Various bug types
- **mutants**: Generic mutants
- **plants**: Plant-based entities
- **radscorpions**: Radiation scorpions
- **rats**: Rodent creatures
- **robots**: Mechanical entities
- **bandits**: Hostile humans
- **citizens**: Neutral NPCs
- **guards**: Protection entities
- **merchants**: Trading NPCs
- **slavers**: Slave traders
- **slaves**: Captured characters
- **tribals**: Tribal groups
- **vips**: Important characters
- **companions**: Player allies
- **strangers**: Unknown NPCs

### Item Categories
- **armor**: Protective equipment
- **helmet**: Head protection
- **weapons**: Combat items
- **ammunition**: Ammo types
- **medicine**: Healing items
- **food**: Consumables
- **tools**: Utility items
- **containers**: Storage items
- **keys**: Access items
- **books**: Reading materials
- **misc**: Miscellaneous items

---

## 🔍 Scripting Reference

### WorldEditor Scripting
WorldEditor uses C# scripting with full .NET 4.0 support:
- **Extension scripts**: Custom functionality
- **LINQ queries**: Data manipulation
- **Full C# 4.0**: Complete language features
- **.NET library**: Access to entire framework

### Script File Types
- **_defines.fos**: Global constants and defines
- **worldmap_h.fos**: Worldmap header definitions
- **_maps.fos**: Map-related definitions
- **ITEMPID.H**: Item PID constants
- ***.fos**: General script files

---

## 🎯 Relevance to Project 412 Mapper

### Direct Applicability
1. **File Structure**: Our AoP server follows the same layout
2. **Proto Categories**: We use similar classification systems
3. **MSG Processing**: Our FOOBJ.MSG integration mirrors this approach
4. **Configuration**: Our aop-nightmare.cfg follows WorldEditor patterns

### Implementation Insights
1. **Entity Classification**: Use WorldEditor categories as reference
2. **File Parsing**: Follow FOCommon patterns for proto/msg parsing
3. **Configuration Structure**: Mirror WorldEditor.cfg organization
4. **Script Integration**: Plan for future script reference support

### Best Practices from Rotators
1. **Modular Design**: Separate parsers for different file types
2. **Multi-language Support**: Prepare for localization
3. **Extension Architecture**: Allow for custom functionality
4. **LINQ-style Queries**: Use for data manipulation (we implemented this)

---

## 📚 Additional Resources

### Rotators GitHub Repositories
- **[fo2238](https://github.com/rotators/fo2238)**: Main FOnline 2238 repository
- **[FOCommon](https://github.com/rotators/FOCommon)**: .NET library for FOnline data
- **[tools](https://github.com/rotators/tools)**: Various FOnline tools

### WorldEditor Features
- **Powerful scripting engine**: C# with full .NET support
- **Comprehensive parsing**: Almost all serverside gamedata
- **Extension system**: Custom scriptable features
- **LINQ integration**: Fast data querying

### Key Credits
- **WorldEditor + base extensions**: Ghosthack
- **Critter Proto editor**: Atom
- **Community**: [fodev.net](http://www.fodev.net)

---

## 🔄 Integration with Our Project

### Current Implementation Status
- ✅ **File Structure**: Following WorldEditor patterns
- ✅ **Entity Classification**: Using similar categories
- ✅ **MSG Processing**: FOOBJ.MSG integration complete
- ✅ **Configuration**: aop-nightmare.cfg follows patterns
- ✅ **LINQ Queries**: Implemented in EntityRepository

### Future Development Opportunities
- 🔄 **Script Reference Integration**: Link entities to scripts
- 🔄 **Dialog System**: Potential dialog editing support
- 🔄 **Multi-language**: Prepare for localization
- 🔄 **Extension System**: Custom mapper functionality

---

*This reference document consolidates essential information from the Rotators FOnline SDK and WorldEditor to support our Project 412 Mapper development. All information is sourced from the official Rotators repositories and documentation.*
