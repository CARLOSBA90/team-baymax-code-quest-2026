export const TERMS_TITLE = "Términos y condiciones";

/** Fragmento de un párrafo: texto plano o texto en negrita. */
export type TermsInline = string | { readonly bold: string };

/** Párrafo: texto plano o una secuencia de fragmentos (para las partes en negrita). */
export type TermsParagraph = string | readonly TermsInline[];

export interface TermsSection {
  readonly heading: string;
  readonly paragraphs: readonly TermsParagraph[];
}

const PLATFORM_NAME = "devtalles paths";

export const TERMS_INTRO: readonly TermsParagraph[] = [
  [{ bold: "Última actualización:" }, " 23/09/2026"],
  ["Bienvenido/a a ", { bold: PLATFORM_NAME }, "."],
  "Nuestra plataforma te ayuda a descubrir y organizar rutas de aprendizaje personalizadas a partir de tus intereses, preferencias y objetivos.",
  "Al crear una cuenta y utilizar la plataforma, aceptas estos Términos y Condiciones.",
];

export const TERMS_SECTIONS: readonly TermsSection[] = [
  {
    heading: "1. Tu cuenta",
    paragraphs: [
      "Para utilizar la plataforma debes crear una cuenta utilizando alguna de las opciones disponibles, como correo electrónico y contraseña, Google, GitHub o Discord.",
      "Debes proporcionar información verdadera y mantener segura tu cuenta. Eres responsable de la actividad realizada desde ella.",
    ],
  },
  {
    heading: "2. Encuesta y rutas de aprendizaje",
    paragraphs: [
      "Después de registrarte, puedes responder una breve encuesta sobre tus intereses y objetivos de aprendizaje.",
      "A partir de tus respuestas, la plataforma puede recomendarte entre una y tres rutas de aprendizaje. Cada ruta puede estar compuesta por diferentes cursos y recursos.",
      "Puedes volver a realizar la encuesta cuando quieras y crear tantas rutas de aprendizaje como desees.",
      [
        "Las recomendaciones tienen un propósito ",
        { bold: "educativo y orientativo" },
        ". No garantizamos que una determinada ruta sea la más adecuada para ti ni que completarla produzca un resultado académico, profesional o laboral específico.",
      ],
    ],
  },
  {
    heading: "3. Seguimiento de tu aprendizaje",
    paragraphs: [
      "Puedes comenzar cursos y marcarlos como terminados para llevar un registro de tu progreso dentro de la plataforma.",
      [
        "Este registro representa únicamente tu progreso personal y ",
        {
          bold: "no constituye una certificación, título o acreditación académica o profesional",
        },
        ", salvo que indiquemos expresamente lo contrario.",
      ],
    ],
  },
  {
    heading: "4. Contenido",
    paragraphs: [
      [
        "Los cursos y recursos disponibles pueden pertenecer a ",
        { bold: PLATFORM_NAME },
        " o a terceros.",
      ],
      "Cuando un contenido pertenezca a un tercero, sus respectivos derechos y condiciones seguirán siendo aplicables. La disponibilidad de un curso o recurso dentro de una ruta no garantiza que permanezca disponible indefinidamente.",
    ],
  },
  {
    heading: "5. Uso de la plataforma",
    paragraphs: [
      "Te comprometes a utilizar la plataforma de forma responsable y legal.",
      "No está permitido intentar acceder a cuentas de otros usuarios, interferir con el funcionamiento de la plataforma, introducir código malicioso, realizar actividades fraudulentas o utilizar la plataforma para fines ilegales.",
      "Podemos suspender o cancelar cuentas que incumplan estas condiciones o que puedan poner en riesgo la plataforma o a otros usuarios.",
    ],
  },
  {
    heading: "6. Tus datos",
    paragraphs: [
      "Para proporcionarte el servicio necesitamos almacenar determinados datos de tu cuenta, como tu correo electrónico y la información básica proporcionada mediante los servicios de autenticación que utilices.",
      "También podemos almacenar las respuestas de la encuesta y la información relacionada con tus rutas y progreso para poder ofrecerte las funcionalidades de la plataforma.",
      "Utilizaremos esta información para proporcionar y mejorar el servicio, de acuerdo con la legislación aplicable.",
    ],
  },
  {
    heading: "7. Disponibilidad del servicio",
    paragraphs: [
      "Trabajamos para mantener la plataforma disponible y funcionando correctamente, pero pueden producirse interrupciones, errores o cambios en el servicio debido a mantenimiento, actualizaciones, problemas técnicos u otras circunstancias.",
      "La plataforma puede evolucionar durante el período de desarrollo del MVP, por lo que algunas funcionalidades pueden cambiar, incorporarse o dejar de estar disponibles.",
    ],
  },
  {
    heading: "8. Propiedad intelectual",
    paragraphs: [
      [
        "El diseño, código, logotipos, textos y demás elementos propios de ",
        { bold: PLATFORM_NAME },
        " pertenecen a sus respectivos propietarios y no pueden ser copiados, modificados o utilizados comercialmente sin autorización.",
      ],
      "Los contenidos pertenecientes a terceros conservan sus respectivos derechos.",
    ],
  },
  {
    heading: "9. Cancelación de tu cuenta",
    paragraphs: [
      "Puedes dejar de utilizar la plataforma y solicitar la cancelación de tu cuenta.",
      "También podemos suspender o cancelar una cuenta cuando exista un incumplimiento de estos Términos y Condiciones.",
    ],
  },
  {
    heading: "10. Cambios en estos términos",
    paragraphs: [
      "Estos Términos pueden actualizarse a medida que evolucione la plataforma. Cuando realicemos cambios importantes, procuraremos informarte.",
      "La fecha de la última actualización siempre aparecerá al principio de este documento.",
    ],
  },
  {
    heading: "11. Contacto",
    paragraphs: [
      "Si tienes alguna pregunta sobre estos Términos y Condiciones, puedes contactarnos en:",
      [{ bold: "contacto@devtallespaths.com" }],
    ],
  },
];

/** Párrafo final, tras el separador. */
export const TERMS_CLOSING: TermsParagraph = [
  "Al crear una cuenta y utilizar ",
  { bold: PLATFORM_NAME },
  ", confirmas que has leído y aceptas estos Términos y Condiciones.",
];

/** Texto plano de un párrafo (sin marcas de negrita); útil como `key` y en tests. */
export function termsParagraphText(paragraph: TermsParagraph): string {
  if (typeof paragraph === "string") return paragraph;
  return paragraph.map((part) => (typeof part === "string" ? part : part.bold)).join("");
}
