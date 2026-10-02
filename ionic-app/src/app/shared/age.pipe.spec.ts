import { AgePipe } from './age.pipe';

describe('AgePipe', () => {
  const pipe = new AgePipe();

  it('muestra solo meses cuando es menor de un año', () => {
    expect(pipe.transform(1)).toBe('1 mes');
    expect(pipe.transform(5)).toBe('5 meses');
  });

  it('muestra solo años cuando son años exactos', () => {
    expect(pipe.transform(12)).toBe('1 año');
    expect(pipe.transform(24)).toBe('2 años');
  });

  it('combina años y meses', () => {
    expect(pipe.transform(14)).toBe('1 año y 2 meses');
    expect(pipe.transform(25)).toBe('2 años y 1 mes');
  });
});
