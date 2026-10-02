import { StorageService } from './storage.service';

describe('StorageService', () => {
  const storage = new StorageService();

  beforeEach(() => localStorage.clear());

  it('guarda y lee objetos como JSON', () => {
    storage.set('cuyo', { name: 'Pelusa', weight_g: 950 });
    expect(storage.get('cuyo')).toEqual({ name: 'Pelusa', weight_g: 950 });
  });

  it('devuelve null si la clave no existe o el dato está corrupto', () => {
    expect(storage.get('no-existe')).toBeNull();

    localStorage.setItem('roto', '{esto no es JSON');
    expect(storage.get('roto')).toBeNull();
  });

  it('borra solo las claves con el prefijo indicado', () => {
    storage.set('cache:/cuyos.php', []);
    storage.set('cache:/foods.php', []);
    storage.set('token', 'abc');

    storage.removeByPrefix('cache:');

    expect(storage.get('cache:/cuyos.php')).toBeNull();
    expect(storage.get('cache:/foods.php')).toBeNull();
    expect(storage.get('token')).toBe('abc');
  });
});
