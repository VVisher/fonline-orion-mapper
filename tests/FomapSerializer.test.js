import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { FomapParser } from '../src/serialization/FomapParser.js';
import { FomapSerializer } from '../src/serialization/FomapSerializer.js';

const FIXTURES = resolve(import.meta.dirname, 'fixtures');

describe('FomapSerializer', () => {
  describe('serialize minimal map', () => {
    it('produces valid .fomap output', () => {
      const mapData = {
        header: {
          Version: 4,
          MaxHexX: 100,
          MaxHexY: 100,
          WorkHexX: 50,
          WorkHexY: 50,
          ScriptModule: '-',
          ScriptFunc: '-',
          NoLogOut: 0,
          Time: 0,
          DayTime: '300  600  1140 1380',
          DayColor0: '18  18  53 ',
          DayColor1: '128 128 128',
          DayColor2: '103 95  86 ',
          DayColor3: '51  40  29 ',
        },
        tiles: [],
        objects: [
          { MapObjType: 2, ProtoId: 5622, MapX: 50, MapY: 50 },
        ],
      };

      const output = FomapSerializer.serialize(mapData);
      expect(output).toContain('[Header]');
      expect(output).toContain('[Tiles]');
      expect(output).toContain('[Objects]');
      expect(output).toContain('MapObjType');
      expect(output).toContain('ProtoId');
      // Unix line endings
      expect(output).not.toContain('\r\n');
    });
  });

  describe('round-trip: filing.fomap', () => {
    it('parse → serialize → parse produces identical data', () => {
      const original = readFileSync(resolve(FIXTURES, 'filing.fomap'), 'utf-8');
      const parsed1 = FomapParser.parse(original);
      const serialized = FomapSerializer.serialize(parsed1);
      const parsed2 = FomapParser.parse(serialized);

      expect(parsed2.header).toEqual(parsed1.header);
      expect(parsed2.tiles).toEqual(parsed1.tiles);
      expect(parsed2.objects).toEqual(parsed1.objects);
    });
  });

  describe('round-trip: d3.fomap', () => {
    it('parse → serialize → parse produces identical data', () => {
      const original = readFileSync(resolve(FIXTURES, 'd3.fomap'), 'utf-8');
      const parsed1 = FomapParser.parse(original);
      const serialized = FomapSerializer.serialize(parsed1);
      const parsed2 = FomapParser.parse(serialized);

      expect(parsed2.header).toEqual(parsed1.header);
      expect(parsed2.tiles).toEqual(parsed1.tiles);
      expect(parsed2.objects.length).toBe(parsed1.objects.length);

      for (let i = 0; i < parsed1.objects.length; i++) {
        expect(parsed2.objects[i]).toEqual(parsed1.objects[i]);
      }
    });
  });

  describe('field formatting', () => {
    it('aligns values at column 21', () => {
      const line = FomapSerializer._formatField('ProtoId', 5622);
      // "ProtoId" = 7 chars, needs 14 spaces to reach col 21
      expect(line).toBe('ProtoId              5622');
    });

    it('handles long field names with at least 1 space', () => {
      const line = FomapSerializer._formatField('Critter_ParamIndex0', 'ST_DIALOG_ID');
      expect(line).toMatch(/^Critter_ParamIndex0\s+ST_DIALOG_ID$/);
      // Should have at least 1 space
      const spaceCount = line.length - 'Critter_ParamIndex0'.length - 'ST_DIALOG_ID'.length;
      expect(spaceCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('tile serialization', () => {
    it('formats tiles with correct column layout', () => {
      const mapData = {
        header: { Version: 4, MaxHexX: 400, MaxHexY: 400 },
        tiles: [
          { hexX: 108, hexY: 20, path: 'art\\tiles\\EDG5001.frm' },
          { hexX: 96, hexY: 22, path: 'art\\tiles\\EDG5007.frm' },
        ],
        objects: [],
      };

      const output = FomapSerializer.serialize(mapData);
      const lines = output.split('\n');
      const tileLine = lines.find(l => l.startsWith('tile'));
      expect(tileLine).toBeDefined();
      // Verify tile starts with "tile       "
      expect(tileLine.startsWith('tile       ')).toBe(true);
    });
  });

  describe('critter serialization', () => {
    it('serializes critter with all param pairs', () => {
      const mapData = {
        header: { Version: 4, MaxHexX: 100, MaxHexY: 100 },
        tiles: [],
        objects: [{
          MapObjType: 0,
          ProtoId: 272,
          MapX: 88,
          MapY: 144,
          Critter_Cond: 1,
          Critter_Anim1: 0,
          Critter_Anim2: 0,
          Critter_ParamIndex0: 'ST_DIALOG_ID',
          Critter_ParamValue0: 0,
          Critter_ParamIndex1: 'ST_AI_ID',
          Critter_ParamValue1: 24,
        }],
      };

      const output = FomapSerializer.serialize(mapData);
      expect(output).toContain('Critter_Cond');
      expect(output).toContain('Critter_ParamIndex0');
      expect(output).toContain('ST_DIALOG_ID');
      expect(output).toContain('Critter_ParamValue0');
      expect(output).toContain('Critter_ParamIndex1');
      expect(output).toContain('ST_AI_ID');

      // Verify ParamIndex always comes before ParamValue
      const idx0 = output.indexOf('Critter_ParamIndex0');
      const val0 = output.indexOf('Critter_ParamValue0');
      const idx1 = output.indexOf('Critter_ParamIndex1');
      const val1 = output.indexOf('Critter_ParamValue1');
      expect(idx0).toBeLessThan(val0);
      expect(val0).toBeLessThan(idx1);
      expect(idx1).toBeLessThan(val1);
    });
  });

  describe('light property serialization', () => {
    it('serializes LightDistance and LightIntensity', () => {
      const mapData = {
        header: { Version: 4, MaxHexX: 100, MaxHexY: 100 },
        tiles: [],
        objects: [{
          MapObjType: 1,
          ProtoId: 25175,
          MapX: 86,
          MapY: 145,
          LightDistance: 8,
          LightIntensity: 50,
        }],
      };

      const output = FomapSerializer.serialize(mapData);
      expect(output).toContain('LightDistance');
      expect(output).toContain('LightIntensity');
    });
  });
});
