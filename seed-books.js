const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read env variables
const envPath = '.env.local';
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function seedBooks() {
  console.log("Seeding books...");
  
  // Get an existing user ID from user_access table
  const { data: accesses, error: accessError } = await supabase
    .from('user_access')
    .select('user_id')
    .limit(1);
    
  if (accessError || !accesses || accesses.length === 0) {
    console.error("Could not find any existing user_id in user_access table.", accessError);
    return;
  }
  const userId = accesses[0].user_id;
  
  const booksToInsert = [
    {
      title: "Módulo 2: Maestria em Foco",
      description: "Técnicas avançadas para blindar sua mente contra distrações digitais.",
      cover_image_url: "",
      total_pages: 10,
      content: [{ name: "Capítulo 1", page: 1 }]
    },
    {
      title: "Módulo 3: O Poder do Hábito",
      description: "Como criar rotinas que funcionam no piloto automático.",
      cover_image_url: "",
      total_pages: 15,
      content: [{ name: "Capítulo 1", page: 1 }]
    },
    {
      title: "Bônus: O Despertar da Produtividade",
      description: "Um guia rápido para suas manhãs.",
      cover_image_url: "",
      total_pages: 5,
      content: [{ name: "Capítulo 1", page: 1 }]
    },
    {
      title: "Masterclass: Sono Profundo",
      description: "O segredo por trás do foco extremo é o descanso.",
      cover_image_url: "",
      total_pages: 8,
      content: [{ name: "Capítulo 1", page: 1 }]
    },
    {
      title: "Material Complementar",
      description: "Arquivos de apoio, planilhas e checklists.",
      cover_image_url: "",
      total_pages: 2,
      content: [{ name: "Capítulo 1", page: 1 }]
    }
  ];

  for (const book of booksToInsert) {
    const { data: insertedBook, error: insertError } = await supabase
      .from('books')
      .insert(book)
      .select('id')
      .single();
      
    if (insertError) {
      console.error("Error inserting book:", insertError);
      continue;
    }
    
    // Grant access
    await supabase
      .from('user_access')
      .insert({
        user_id: userId,
        book_id: insertedBook.id
      });
  }
  
  console.log("Books seeded and access granted to", userId);
}

seedBooks();
