import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { identifier, password } = await req.json()

    if (!identifier || !password) {
      return new Response(
        JSON.stringify({ error: 'NIS/NIT dan password wajib diisi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Cek apakah admin
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id, username, password_hash')
      .eq('username', identifier)
      .single()

    if (adminData) {
      // Verify admin password
      const { data: isValidAdmin } = await supabase.rpc('verify_password', {
        input_password: password,
        stored_hash: adminData.password_hash
      })

      if (isValidAdmin) {
        return new Response(
          JSON.stringify({
            success: true,
            user: {
              id: adminData.id,
              identifier: adminData.username,
              role: 'admin',
              name: 'Administrator'
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 2. Cek apakah siswa (by NIS)
    const { data: studentData } = await supabase
      .from('students')
      .select('id, nis, full_name, class_id, password_hash')
      .eq('nis', identifier)
      .single()

    if (studentData) {
      // Verify student password
      const { data: isValidStudent } = await supabase.rpc('verify_password', {
        input_password: password,
        stored_hash: studentData.password_hash
      })

      if (isValidStudent) {
        // Get class name
        let className = null
        if (studentData.class_id) {
          const { data: classData } = await supabase
            .from('classes')
            .select('name')
            .eq('id', studentData.class_id)
            .single()
          className = classData?.name
        }

        return new Response(
          JSON.stringify({
            success: true,
            user: {
              id: studentData.id,
              identifier: studentData.nis,
              role: 'siswa',
              name: studentData.full_name,
              class_id: studentData.class_id,
              class_name: className
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 3. Cek apakah guru (by NIT)
    const { data: teacherData } = await supabase
      .from('teachers')
      .select('id, nit, full_name, subject, password_hash')
      .eq('nit', identifier)
      .single()

    if (teacherData) {
      // Verify teacher password
      const { data: isValidTeacher } = await supabase.rpc('verify_password', {
        input_password: password,
        stored_hash: teacherData.password_hash
      })

      if (isValidTeacher) {
        return new Response(
          JSON.stringify({
            success: true,
            user: {
              id: teacherData.id,
              identifier: teacherData.nit,
              role: 'guru',
              name: teacherData.full_name,
              subject: teacherData.subject
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Login gagal
    return new Response(
      JSON.stringify({ error: 'NIS/NIT atau password salah' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan server' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
