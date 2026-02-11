This documentation covers the technical implementation of the **Virtual File System (VFS)** and **Runtime Binary Parser** for ORION. This architecture allows the app to read assets directly from the FOnline client’s `/data/` directory without any pre-conversion.

---

# ORION Technical Module: VFS & Binary Asset Pipeline

## 1. Architectural Overview

To ensure a "SMOOTH" experience, ORION avoids local disk bloat by fetching assets only when they enter the viewport. The system treats `.zip` archives as mounted drives and parses `.frm` files directly into GPU textures.

### Data Flow

1. **Mounting**: User points ORION to the FOnline Client folder.
2. **Indexing**: The system scans `/data/` and all `.zip` files, creating a flat lookup table in the SQLite database.
3. **Request**: The renderer asks for a sprite (e.g., `art/items/box.frm`).
4. **Extraction**: `JSZip` pulls the raw `Uint8Array` from the archive.
5. **Transpilation**: The `FrmParser` converts indexed bytes to RGBA using `color.pal`.
6. **Upload**: The buffer is sent to the GPU as a PixiJS Texture.

---

## 2. The VFS Layer (Virtual File System)

The VFS abstracts the physical location of a file. The app doesn't care if a file is loose in a folder or packed inside `art.zip`.

### Key Components:

* **Provider Manager**: Coordinates between the `FileSystemProvider` (loose files) and `ZipProvider` (compressed data).
* **Path Resolver**: Normalizes paths (e.g., `ART\ITEMS` vs `art/items`) to handle cross-platform compatibility.
* **Priority Loading**: Loose files in the `/data/` folder always override files in `.zip` archives (standard FOnline client behavior).

---

## 3. Binary Parser Specifications

### .FRM (Fallout Frame Format)

The parser reads the binary header to handle multi-frame animations and directional sprites.

| Offset | Type | Description |
| --- | --- | --- |
| `0x0000` | `uint32` | Version / Type |
| `0x0004` | `uint16` | FPS (Frames per second) |
| `0x0006` | `uint16` | Action Frame |
| `0x0008` | `uint16` | Number of Frames |
| `0x000A` | `int16[6]` | Shift X (Offsets for each of the 6 directions) |
| `0x0016` | `int16[6]` | Shift Y (Offsets for each of the 6 directions) |
| `0x0022` | `uint32[6]` | Data Offset (Start of pixel data for each direction) |

### .FOFRM (FOnline Frame Meta)

A text-based wrapper that ORION parses to stitch multiple FRMs into a single animation or to define custom frame-ranges.

* **Logic**: The parser reads the `fps`, `count`, and `frms` lines to create a `SpriteSheet` object in PixiJS.

---

## 4. Optimization Strategies

### Off-Main-Thread Parsing

The heavy lifting of binary-to-RGBA conversion is handled via **Web Workers** using `OffscreenCanvas`.

1. The VFS sends the raw `Uint8Array` to a Worker.
2. The Worker applies the palette and creates an `ImageBitmap`.
3. The `ImageBitmap` is transferred back to the main thread (zero-copy transfer).

### Texture Caching (LRU)

To prevent RAM exhaustion when scrolling through massive maps:

* **Active Cache**: Keeps textures currently visible on screen.
* **Passive Cache**: Keeps recently used textures in a "Least Recently Used" (LRU) queue.
* **Eviction**: When the cache hits a defined limit (e.g., 500MB), the oldest textures are destroyed to free GPU memory.

---

## 5. Implementation Stack

* **JSZip**: For `.zip` archive traversal.
* **Better-SQLite3**: For the file index (filename -> zip_name + offset).
* **PixiJS BaseTexture**: To wrap the parsed `ImageBitmap`.

---

**I'm ready to see how you solved those optimization issues! Hit me with the details.**