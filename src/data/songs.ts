import { Song } from '../types';

export const INITIAL_SONGS: Song[] = [
  {
    id: 'senor-mi-dios',
    title: 'Señor mi Dios',
    artist: 'Hagamos Música / Tradicional',
    tag: 'CONGRE',
    bpm: 70,
    originalKey: 'G',
    sections: [
      {
        title: 'VERSO 1',
        lines: [
          {
            chordPro: '[G]Señor mi Dios, al con[C]templar los cielos',
            lyrics: 'Señor mi Dios, al contemplar los cielos',
          },
          {
            chordPro: '[D]El firmamento y las es[G]trellas mil',
            lyrics: 'El firmamento y las estrellas mil',
          },
          {
            chordPro: '[G]Al oír Tu voz en los po[C]tentes truenos',
            lyrics: 'Al oír Tu voz en los potentes truenos',
          },
          {
            chordPro: '[D]Y ver brillar el sol en [G]su cenit',
            lyrics: 'Y ver brillar el sol en su cenit',
          }
        ]
      },
      {
        title: 'CORO',
        isChorus: true,
        lines: [
          {
            chordPro: '[G]Mi corazón ento[C]na la can[G]ción',
            lyrics: 'Mi corazón entona la canción',
          },
          {
            chordPro: '¡Cuán grande es [Am]Él! ¡Cuán [D]grande es [G]Él!',
            lyrics: '¡Cuán grande es Él! ¡Cuán grande es Él!',
          },
          {
            chordPro: '[G]Mi corazón ento[C]na la can[G]ción',
            lyrics: 'Mi corazón entona la canción',
          },
          {
            chordPro: '¡Cuán grande es [Am]Él! ¡Cuán [D]grande es [G]Él!',
            lyrics: '¡Cuán grande es Él! ¡Cuán grande es Él!',
          }
        ]
      }
    ]
  },
  {
    id: 'que-ruja-el-leon',
    title: 'Que ruja el león',
    artist: 'Mike Bunster',
    tag: 'MIO',
    bpm: 74,
    originalKey: 'Em',
    isFavorite: true,
    favoriteAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    sections: [
      {
        title: 'VERSO 1',
        lines: [
          {
            chordPro: '[Em]Que se abran los cielos, que [C]caiga Tu lluvia',
            lyrics: 'Que se abran los cielos, que caiga Tu lluvia',
          },
          {
            chordPro: '[G]Un rugido de glo[D]ria se oye en Tu casa',
            lyrics: 'Un rugido de gloria se oye en Tu casa',
          }
        ]
      },
      {
        title: 'CORO',
        isChorus: true,
        lines: [
          {
            chordPro: '[Em]Que ruja el León, que [C]ruja el León de Ju[G]dá',
            lyrics: 'Que ruja el León, que ruja el León de Judá',
          }
        ]
      }
    ]
  },
  {
    id: 'quien-podra',
    title: '¿Quién podrá?',
    artist: 'Averly Morillo',
    tag: 'CONGRE',
    bpm: 68,
    originalKey: 'C',
    isFavorite: false,
    sections: [
      {
        title: 'VERSO 1',
        lines: [
          {
            chordPro: '[C]¿Quién podrá mantenerse an[G]te Tu majestad?',
            lyrics: '¿Quién podrá mantenerse ante Tu majestad?',
          },
          {
            chordPro: '[Am]Ante el brillo e infini[F]to de Tu santidad',
            lyrics: 'Ante el brillo e infinito de Tu santidad',
          }
        ]
      },
      {
        title: 'CORO',
        isChorus: true,
        lines: [
          {
            chordPro: '[C]Nadie como Tú, Se[G]ñor, Santo y [Am]digno de adoración',
            lyrics: 'Nadie como Tú, Señor, Santo y digno de adoración',
          }
        ]
      }
    ]
  },
  {
    id: 'piedra-angular',
    title: 'Piedra angular',
    artist: 'Llave de David',
    tag: 'MIO',
    bpm: 72,
    originalKey: 'A',
    isFavorite: true,
    favoriteAt: Date.now() - 1000 * 60 * 60 * 24,
    sections: [
      {
        title: 'VERSO 1',
        lines: [
          {
            chordPro: '[A]En la tempestad, mi [F#]ancla estará',
            lyrics: 'En la tempestad, mi ancla estará',
          },
          {
            chordPro: '[D]En Tu fidelidad y [E]en Tu amor',
            lyrics: 'En Tu fidelidad y en Tu amor',
          }
        ]
      },
      {
        title: 'CORO',
        isChorus: true,
        lines: [
          {
            chordPro: '[A]Cristo es la Piedra Angu[E]lar, firme sostén en la [F#]tormenta',
            lyrics: 'Cristo es la Piedra Angular, firme sostén en la tormenta',
          }
        ]
      }
    ]
  },
  {
    id: 'yeshua',
    title: 'Yeshua',
    artist: 'Instrumental / Ministración',
    tag: 'CONGRE',
    bpm: 66,
    originalKey: 'D',
    sections: [
      {
        title: 'VERSO 1',
        lines: [
          {
            chordPro: '[D]Yeshua, nombre sobre todo [G]nombre',
            lyrics: 'Yeshua, nombre sobre todo nombre',
          },
          {
            chordPro: '[A]Rey de reyes, Señor de todo [D]corazón',
            lyrics: 'Rey de reyes, Señor de todo corazón',
          }
        ]
      },
      {
        title: 'CORO',
        isChorus: true,
        lines: [
          {
            chordPro: '[G]Yeshua, [D]eres digno de ado[A]rar',
            lyrics: 'Yeshua, eres digno de adorar',
          }
        ]
      }
    ]
  },
  {
    id: 'vistenos-de-danza',
    title: 'Vístenos de Danza',
    artist: 'Michael Bunster',
    tag: 'MIO',
    bpm: 88,
    originalKey: 'G',
    sections: [
      { title: 'VERSO 1', lines: [{ chordPro: '[G]Vístenos de danza, [C]llénanos de gozo', lyrics: 'Vístenos de danza, llénanos de gozo' }] },
      { title: 'CORO', isChorus: true, lines: [{ chordPro: '[D]Que tu río [G]fluya en este lugar', lyrics: 'Que tu río fluya en este lugar' }] },
    ],
  },
  {
    id: 'resplandece-tu-luz',
    title: 'Resplandece tu Luz',
    artist: 'Aragón – Weigandt',
    tag: 'MIO',
    bpm: 72,
    originalKey: 'A',
    sections: [
      { title: 'VERSO 1', lines: [{ chordPro: '[A]Resplandece tu luz [D]sobre nosotros', lyrics: 'Resplandece tu luz sobre nosotros' }] },
      { title: 'CORO', isChorus: true, lines: [{ chordPro: '[E]Brilla Jesús, [A]brilla en mí', lyrics: 'Brilla Jesús, brilla en mí' }] },
    ],
  },
  {
    id: 'al-que-esta-sentado',
    title: 'Al que está sentado',
    artist: 'Lucas Conslie',
    tag: 'MIO',
    bpm: 70,
    originalKey: 'C',
    sections: [
      { title: 'VERSO 1', lines: [{ chordPro: '[C]Al que está sentado [G]en el trono', lyrics: 'Al que está sentado en el trono' }] },
      { title: 'CORO', isChorus: true, lines: [{ chordPro: '[Am]Sea la gloria [F]y el honor', lyrics: 'Sea la gloria y el honor' }] },
    ],
  },
  {
    id: 'jesus-es-agua-de-vida',
    title: 'Jesús es agua de vida',
    artist: 'La Roca',
    tag: 'MIO',
    bpm: 76,
    originalKey: 'D',
    sections: [
      { title: 'VERSO 1', lines: [{ chordPro: '[D]Jesús es agua de [G]vida que sacia mi sed', lyrics: 'Jesús es agua de vida que sacia mi sed' }] },
      { title: 'CORO', isChorus: true, lines: [{ chordPro: '[A]Ríos de agua viva [D]fluyen en mí', lyrics: 'Ríos de agua viva fluyen en mí' }] },
    ],
  },
];
