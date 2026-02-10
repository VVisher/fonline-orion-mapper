import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { FomapParser } from '../src/serialization/FomapParser.js';

const FIXTURES = resolve(import.meta.dirname, 'fixtures');

describe('FomapParser', () => {
  describe('parse filing.fomap', () => {
    const content = readFileSync(resolve(FIXTURES, 'filing.fomap'), 'utf-8');
    const map = FomapParser.parse(content);

    it('parses header fields', () => {
      expect(map.header.Version).toBe(4);
      expect(map.header.MaxHexX).toBe(200);
      expect(map.header.MaxHexY).toBe(200);
      expect(map.header.WorkHexX).toBe(151);
      expect(map.header.WorkHexY).toBe(166);
      expect(map.header.ScriptModule).toBe('-');
      expect(map.header.ScriptFunc).toBe('-');
      expect(map.header.NoLogOut).toBe(0);
      expect(map.header.Time).toBe(0);
    });

    it('parses multi-value header fields as raw strings', () => {
      expect(map.header.DayTime).toBeDefined();
      expect(map.header.DayColor0).toBeDefined();
      expect(map.header.DayColor1).toBeDefined();
      expect(map.header.DayColor2).toBeDefined();
      expect(map.header.DayColor3).toBeDefined();
    });

    it('has no tiles', () => {
      expect(map.tiles).toHaveLength(0);
    });

    it('parses all objects', () => {
      expect(map.objects.length).toBeGreaterThan(0);
    });

    it('parses scenery objects (MapObjType 2)', () => {
      const scenery = map.objects.filter(o => o.MapObjType === 2);
      expect(scenery.length).toBeGreaterThan(0);
      expect(scenery[0].ProtoId).toBe(5622);
      expect(scenery[0].MapX).toBe(146);
      expect(scenery[0].MapY).toBe(154);
    });

    it('parses item objects with scripts (MapObjType 1)', () => {
      const items = map.objects.filter(o => o.MapObjType === 1);
      expect(items.length).toBeGreaterThan(0);

      const locker = items[0];
      expect(locker.ProtoId).toBe(666);
      expect(locker.ScriptName).toBe('PHX_dungeons');
      expect(locker.FuncName).toBe('_InitDungeonLocker');
      expect(locker.OffsetX).toBe(-7);
      expect(locker.OffsetY).toBe(8);
      expect(locker.Item_Val0).toBe(5940);
    });

    it('parses Item_Val1 when present', () => {
      const withVal1 = map.objects.find(o => o.Item_Val1 !== undefined);
      expect(withVal1).toBeDefined();
      expect(withVal1.Item_Val1).toBe(4);
    });
  });

  describe('parse d3.fomap', () => {
    const content = readFileSync(resolve(FIXTURES, 'd3.fomap'), 'utf-8');
    const map = FomapParser.parse(content);

    it('parses header with Time=-1', () => {
      expect(map.header.Version).toBe(4);
      expect(map.header.MaxHexX).toBe(400);
      expect(map.header.MaxHexY).toBe(400);
      expect(map.header.Time).toBe(-1);
    });

    it('parses tiles', () => {
      expect(map.tiles.length).toBeGreaterThan(0);
      expect(map.tiles[0].hexX).toBe(108);
      expect(map.tiles[0].hexY).toBe(20);
      expect(map.tiles[0].path).toBe('art\\tiles\\EDG5001.frm');
    });

    it('parses critters (MapObjType 0)', () => {
      const critters = map.objects.filter(o => o.MapObjType === 0);
      expect(critters.length).toBeGreaterThan(0);
    });

    it('parses critter fields correctly', () => {
      const critter = map.objects.find(o => o.MapObjType === 0);
      expect(critter.Critter_Cond).toBe(1);
      expect(critter.Critter_Anim1).toBe(0);
      expect(critter.Critter_Anim2).toBe(0);
      expect(critter.Critter_ParamIndex0).toBe('ST_DIALOG_ID');
      expect(critter.Critter_ParamValue0).toBe(0);
    });

    it('parses critter Dir field', () => {
      const critterWithDir = map.objects.find(o => o.MapObjType === 0 && o.Dir !== undefined);
      expect(critterWithDir).toBeDefined();
      expect(typeof critterWithDir.Dir).toBe('number');
    });

    it('parses LightDistance and LightIntensity', () => {
      const lit = map.objects.find(o => o.LightDistance !== undefined);
      expect(lit).toBeDefined();
      expect(lit.LightDistance).toBe(8);
      expect(lit.LightIntensity).toBe(50);
    });

    it('parses objects after tiles section', () => {
      const scenery = map.objects.filter(o => o.MapObjType === 2);
      const items = map.objects.filter(o => o.MapObjType === 1);
      const critters = map.objects.filter(o => o.MapObjType === 0);
      expect(scenery.length + items.length + critters.length).toBe(map.objects.length);
    });
  });

  describe('edge cases', () => {
    it('handles minimal map', () => {
      const content = [
        '[Header]',
        'Version              4',
        'MaxHexX              100',
        'MaxHexY              100',
        '',
        '[Tiles]',
        '',
        '[Objects]',
        '',
      ].join('\n');

      const map = FomapParser.parse(content);
      expect(map.header.Version).toBe(4);
      expect(map.tiles).toHaveLength(0);
      expect(map.objects).toHaveLength(0);
    });

    it('handles CRLF line endings', () => {
      const content = '[Header]\r\nVersion              4\r\nMaxHexX              100\r\nMaxHexY              100\r\n\r\n[Tiles]\r\n\r\n[Objects]\r\n\r\n';
      const map = FomapParser.parse(content);
      expect(map.header.Version).toBe(4);
    });
  });
});
