import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/prisma/prisma.service.js';
import { SkillCategory } from '../src/generated/prisma/enums.js';
import { CatalogService } from '../src/modules/catalog/catalog.service.js';

const COURSES_CSV_PATH = fileURLToPath(
  new URL('./seed/courses.csv', import.meta.url),
);

interface SeedOption {
  text: string;
  value: number;
  order: number;
}

interface SeedQuestion {
  text: string;
  category: keyof typeof SkillCategory;
  order: number;
  options: SeedOption[];
}

const questionsToSeed: SeedQuestion[] = [
  {
    order: 1,
    category: SkillCategory.WEB_FUNDAMENTALS,
    text: '¿Cuál es tu principal objetivo profesional en este momento?',
    options: [
      {
        order: 1,
        value: 5,
        text: 'Construir interfaces de usuario y aplicaciones web interactivas',
      },
      {
        order: 2,
        value: 5,
        text: 'Diseñar servidores, APIs robustas y arquitecturas escalables',
      },
      {
        order: 3,
        value: 5,
        text: 'Crear aplicaciones para dispositivos móviles iOS y Android',
      },
      {
        order: 4,
        value: 5,
        text: 'Estoy empezando desde cero en el mundo de la programación',
      },
    ],
  },
  {
    order: 2,
    category: SkillCategory.WEB_FUNDAMENTALS,
    text: '¿Cómo describirías tu nivel actual de lógica y fundamentos de programación?',
    options: [
      { order: 1, value: 1, text: 'Nunca he escrito una línea de código' },
      {
        order: 2,
        value: 2,
        text: 'Conozco variables, bucles y condicionales básicos',
      },
      {
        order: 3,
        value: 3,
        text: 'Domino la programación estructurada y tipado con TypeScript',
      },
      {
        order: 4,
        value: 4,
        text: 'Tengo bases sólidas y aplico principios SOLID y patrones de diseño',
      },
    ],
  },
  {
    order: 3,
    category: SkillCategory.FRONTEND,
    text: '¿Cuál es tu experiencia construyendo interfaces con frameworks web modernos?',
    options: [
      {
        order: 1,
        value: 1,
        text: 'Ninguna, solo conozco lo básico de HTML y CSS',
      },
      {
        order: 2,
        value: 2,
        text: 'He probado React, Angular o Vue en proyectos pequeños o tutoriales',
      },
      {
        order: 3,
        value: 3,
        text: 'Construyo aplicaciones completas con gestión de estado global',
      },
      {
        order: 4,
        value: 4,
        text: 'Desarrollo aplicaciones en producción con SSR y frameworks fullstack como Next.js o Nuxt',
      },
    ],
  },
  {
    order: 4,
    category: SkillCategory.BACKEND,
    text: '¿Cuál es tu nivel desarrollando APIs y trabajando con bases de datos?',
    options: [
      {
        order: 1,
        value: 1,
        text: 'No tengo experiencia con servidores ni bases de datos',
      },
      {
        order: 2,
        value: 2,
        text: 'He realizado consultas básicas en SQL con PostgreSQL o scripts sencillos',
      },
      {
        order: 3,
        value: 3,
        text: 'He creado APIs REST funcionales con Node.js, Python, Java o C#',
      },
      {
        order: 4,
        value: 4,
        text: 'Diseño arquitecturas avanzadas como Microservicios, Arquitectura Hexagonal o GraphQL',
      },
    ],
  },
  {
    order: 5,
    category: SkillCategory.BACKEND,
    text: '¿Cómo te gustaría integrar Inteligencia Artificial en tu ruta de aprendizaje?',
    options: [
      {
        order: 1,
        value: 1,
        text: 'Por ahora prefiero consolidar las bases tradicionales de desarrollo',
      },
      {
        order: 2,
        value: 2,
        text: 'Quiero aprender a usar herramientas de asistencia y técnicas de prompts',
      },
      {
        order: 3,
        value: 3,
        text: 'Quiero construir aplicaciones que consuman modelos LLM y técnicas de RAG',
      },
      {
        order: 4,
        value: 4,
        text: 'Quiero desarrollar agentes autónomos y flujos de automatización con n8n y MCP',
      },
    ],
  },
  {
    order: 6,
    category: SkillCategory.DEVOPS,
    text: '¿Tienes interés en complementar tu formación con DevOps o Testing?',
    options: [
      {
        order: 1,
        value: 1,
        text: 'No por el momento, quiero enfocarme exclusivamente en escribir código de aplicación',
      },
      {
        order: 2,
        value: 2,
        text: 'Me interesa aprender Docker y gestión de contenedores',
      },
      {
        order: 3,
        value: 3,
        text: 'Me interesa dominar pruebas unitarias y pruebas de extremo a extremo e2e',
      },
    ],
  },
  {
    order: 7,
    category: SkillCategory.WEB_FUNDAMENTALS,
    text: '¿Cuánto tiempo estimado puedes dedicar al estudio de forma semanal?',
    options: [
      {
        order: 1,
        value: 1,
        text: 'Menos de 3 horas por semana (Ruta sugerida corta: 2 a 3 cursos)',
      },
      {
        order: 2,
        value: 2,
        text: 'Entre 4 y 7 horas por semana (Ruta sugerida estándar: 4 a 5 cursos)',
      },
      {
        order: 3,
        value: 3,
        text: 'Más de 8 horas por semana (Ruta sugerida intensiva: hasta 8 cursos)',
      },
    ],
  },
];

async function seedQuestions() {
  console.log('Iniciando seed de preguntas para CodeQuest...');

  // Evitar fallos por restricciones de clave foránea o duplicados si ya existen preguntas
  const existingQuestionsCount = await prisma.question.count();
  if (existingQuestionsCount > 0) {
    console.log(
      `✓ Ya existen ${existingQuestionsCount} preguntas en la base de datos. Saltando seed.`,
    );
    return;
  }

  for (const q of questionsToSeed) {
    const createdQuestion = await prisma.question.create({
      data: {
        order: q.order,
        category: q.category,
        text: q.text,
        active: true,
        options: {
          create: q.options.map((opt) => ({
            order: opt.order,
            value: opt.value,
            text: opt.text,
          })),
        },
      },
      include: {
        options: true,
      },
    });

    console.log(
      `✓ Pregunta ${createdQuestion.order} creada con ${createdQuestion.options.length} opciones [${createdQuestion.category}]`,
    );
  }
}

/** Importa el CSV del catálogo; reimportarlo no duplica ni reescribe cursos. */
async function seedCourses() {
  console.log('Importando catálogo desde prisma/seed/courses.csv...');

  const csv = await readFile(COURSES_CSV_PATH, 'utf8');
  const { message, data } = await new CatalogService(prisma).importFromCsv(csv);

  console.log(message);
  for (const error of data.errors) {
    console.warn(
      `Fila ${error.row ?? '-'} (${error.slug ?? '-'}): ${error.message}`,
    );
  }
}

async function main() {
  await seedQuestions();
  await seedCourses();

  console.log('Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
