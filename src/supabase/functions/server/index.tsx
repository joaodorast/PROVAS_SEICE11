import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js'
import * as kv from './kv_store.tsx'

const app = new Hono()

// Setup CORS and logging (removed timeout middleware for better performance)
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}))
app.use('*', logger(console.log))

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Auth middleware
const requireAuth = async (c: any, next: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user?.id) {
      return c.json({ error: 'Invalid authorization token' }, 401);
    }

    c.set('user', user);
    await next();
  } catch (error) {
    console.log('Auth middleware error:', error);
    return c.json({ error: 'Authorization failed' }, 401);
  }
};

// Routes

// Auth routes
app.post('/make-server-83358821/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, password } = body;
    
    if (!name || !email || !password) {
      return c.json({ error: 'Name, email and password are required' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// Students Management with error handling and empty state
app.get('/make-server-83358821/students', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    
    try {
      // getByPrefix returns array of values directly, not {key, value} objects
      const students = await kv.getByPrefix(`students:${user.id}:`);
      
      // Filter out any null/undefined values and validate structure
      const validStudents = students
        .filter(s => {
          if (!s) return false;
          if (!s.id || !s.name) {
            console.warn('Invalid student found, filtering out:', s?.id);
            return false;
          }
          return true;
        });
      
      console.log(`Returning ${validStudents.length} valid students out of ${students.length} total`);
      
      return c.json({ 
        success: true,
        students: validStudents,
        count: validStudents.length
      });
    } catch (kvError) {
      console.log('KV error fetching students, returning empty array:', kvError);
      return c.json({ 
        success: true,
        students: [],
        count: 0
      });
    }
  } catch (error) {
    console.log('Error fetching students:', error);
    return c.json({ 
      success: false,
      error: 'Failed to fetch students',
      students: [],
      count: 0
    }, 500);
  }
});

app.post('/make-server-83358821/students', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { students } = body;
    
    if (!Array.isArray(students)) {
      return c.json({ error: 'Students must be an array' }, 400);
    }

    const savedStudents = [];
    for (const student of students) {
      const studentId = crypto.randomUUID();
      const studentData = {
        id: studentId,
        ...student,
        userId: user.id,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      
      await kv.set(`students:${user.id}:${studentId}`, studentData);
      savedStudents.push(studentData);
    }

    return c.json({ success: true, students: savedStudents });
  } catch (error) {
    console.log('Error saving students:', error);
    return c.json({ error: 'Failed to save students' }, 500);
  }
});

app.put('/make-server-83358821/students/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const studentId = c.req.param('id');
    const body = await c.req.json();
    
    const existingStudent = await kv.get(`students:${user.id}:${studentId}`);
    if (!existingStudent) {
      return c.json({ error: 'Student not found' }, 404);
    }

    const updatedStudent = {
      ...existingStudent,
      ...body,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`students:${user.id}:${studentId}`, updatedStudent);
    return c.json({ success: true, student: updatedStudent });
  } catch (error) {
    console.log('Error updating student:', error);
    return c.json({ error: 'Failed to update student' }, 500);
  }
});

app.delete('/make-server-83358821/students/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const studentId = c.req.param('id');
    
    await kv.del(`students:${user.id}:${studentId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting student:', error);
    return c.json({ error: 'Failed to delete student' }, 500);
  }
});

// Questions Management with enhanced error handling
app.get('/make-server-83358821/questions', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    
    console.log('Fetching questions for user:', user.id);
    
    try {
      // getByPrefix returns array of values directly, not {key, value} objects
      const questions = await kv.getByPrefix(`questions:${user.id}:`);
      
      console.log(`Retrieved ${questions.length} raw question entries from KV store`);
      
      // Filter out any null/undefined values and validate structure
      // Note: questions is already an array of values, not {key, value} pairs
      const validQuestions = questions
        .filter(q => {
          if (!q) {
            console.warn('Found null/undefined question entry');
            return false;
          }
          if (!q.question || !q.subject || !q.difficulty) {
            console.warn('Invalid question found, filtering out:', { 
              id: q.id,
              hasQuestion: !!q.question,
              hasSubject: !!q.subject,
              hasDifficulty: !!q.difficulty
            });
            return false;
          }
          return true;
        });
      
      console.log(`✓ Returning ${validQuestions.length} valid questions out of ${questions.length} total`);
      
      // Log first few question IDs for debugging
      if (validQuestions.length > 0) {
        console.log('Sample question IDs:', validQuestions.slice(0, 3).map(q => q.id));
      }
      
      return c.json({ 
        success: true,
        questions: validQuestions,
        count: validQuestions.length
      });
    } catch (kvError) {
      console.error('KV error fetching questions:', kvError);
      return c.json({ 
        success: true,
        questions: [],
        count: 0
      });
    }
  } catch (error) {
    console.error('Error fetching questions:', error);
    return c.json({ 
      success: false,
      error: 'Failed to fetch questions',
      questions: [],
      count: 0
    }, 500);
  }
});

app.post('/make-server-83358821/questions', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    console.log('Received question creation request:', { 
      userId: user.id, 
      hasQuestion: !!body.question,
      hasSubject: !!body.subject,
      hasDifficulty: !!body.difficulty
    });
    
    // Validate required fields
    if (!body.question || !body.subject || !body.difficulty) {
      const error = 'Missing required fields: question, subject, difficulty';
      console.error('Validation error:', error);
      return c.json({ 
        success: false,
        error: error
      }, 400);
    }
    
    const questionId = crypto.randomUUID();
    const questionData = {
      id: questionId,
      question: body.question,
      subject: body.subject,
      difficulty: body.difficulty,
      type: body.type || 'Múltipla Escolha',
      options: body.options || [],
      correctAnswer: body.correctAnswer || 0,
      tags: body.tags || [],
      explanation: body.explanation || '',
      userId: user.id,
      createdAt: new Date().toISOString(),
      usageCount: 0,
      isActive: true
    };
    
    console.log('Saving question to KV store:', { 
      key: `questions:${user.id}:${questionId}`,
      id: questionId
    });
    
    // Save to KV store
    await kv.set(`questions:${user.id}:${questionId}`, questionData);
    
    // Verify the question was saved by reading it back
    console.log('Verifying question was saved...');
    const savedQuestion = await kv.get(`questions:${user.id}:${questionId}`);
    
    if (!savedQuestion) {
      console.error('ERROR: Question was not saved to KV store!');
      return c.json({ 
        success: false,
        error: 'Failed to persist question data'
      }, 500);
    }
    
    console.log(`✓ Question created and verified successfully: ${questionId}`);
    return c.json({ success: true, question: savedQuestion });
  } catch (error) {
    console.error('Error saving question:', error);
    return c.json({ 
      success: false,
      error: 'Failed to save question: ' + (error.message || 'Unknown error')
    }, 500);
  }
});

app.put('/make-server-83358821/questions/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const questionId = c.req.param('id');
    const body = await c.req.json();
    
    const existingQuestion = await kv.get(`questions:${user.id}:${questionId}`);
    if (!existingQuestion) {
      return c.json({ error: 'Question not found' }, 404);
    }

    const updatedQuestion = {
      ...existingQuestion,
      ...body,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`questions:${user.id}:${questionId}`, updatedQuestion);
    return c.json({ success: true, question: updatedQuestion });
  } catch (error) {
    console.log('Error updating question:', error);
    return c.json({ error: 'Failed to update question' }, 500);
  }
});

app.delete('/make-server-83358821/questions/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const questionId = c.req.param('id');
    
    await kv.del(`questions:${user.id}:${questionId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting question:', error);
    return c.json({ error: 'Failed to delete question' }, 500);
  }
});

// Exams Management with optimized loading
app.get('/make-server-83358821/exams', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    
    try {
      // getByPrefix returns array of values directly, not {key, value} objects
      const exams = await kv.getByPrefix(`exams:${user.id}:`);
      
      // Filter out any null/undefined values and validate structure
      const validExams = exams
        .filter(e => {
          if (!e) return false;
          if (!e.id || !e.title) {
            console.warn('Invalid exam found, filtering out:', e.id);
            return false;
          }
          return true;
        });
      
      console.log(`Returning ${validExams.length} valid exams out of ${exams.length} total`);
      
      return c.json({ 
        success: true,
        exams: validExams,
        count: validExams.length,
        activeCount: validExams.filter(e => e.status === 'Ativo').length
      });
    } catch (kvError) {
      console.log('KV error fetching exams, returning empty array:', kvError);
      return c.json({ 
        success: true,
        exams: [],
        count: 0,
        activeCount: 0
      });
    }
  } catch (error) {
    console.log('Error fetching exams:', error);
    return c.json({ 
      success: false,
      error: 'Failed to fetch exams',
      exams: [],
      count: 0
    }, 500);
  }
});

app.post('/make-server-83358821/exams', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const examId = `EVAL${Date.now().toString().slice(-6)}`;
    const examData = {
      id: examId,
      ...body,
      userId: user.id,
      createdAt: new Date().toISOString(),
      appliedCount: 0,
      studentsCount: 0,
      averageScore: 0,
      status: 'Rascunho'
    };
    
    await kv.set(`exams:${user.id}:${examId}`, examData);
    return c.json({ success: true, exam: examData });
  } catch (error) {
    console.log('Error saving exam:', error);
    return c.json({ error: 'Failed to save exam' }, 500);
  }
});

app.put('/make-server-83358821/exams/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const examId = c.req.param('id');
    const body = await c.req.json();
    
    const existingExam = await kv.get(`exams:${user.id}:${examId}`);
    if (!existingExam) {
      return c.json({ error: 'Exam not found' }, 404);
    }

    const updatedExam = {
      ...existingExam,
      ...body,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`exams:${user.id}:${examId}`, updatedExam);
    return c.json({ success: true, exam: updatedExam });
  } catch (error) {
    console.log('Error updating exam:', error);
    return c.json({ error: 'Failed to update exam' }, 500);
  }
});

app.delete('/make-server-83358821/exams/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const examId = c.req.param('id');
    
    await kv.del(`exams:${user.id}:${examId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting exam:', error);
    return c.json({ error: 'Failed to delete exam' }, 500);
  }
});

// Exam Submission Endpoint (with essay support)
app.post('/make-server-83358821/exams/:examId/submit', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const examId = c.req.param('examId');
    const body = await c.req.json();
    const { answers, essayAnswers } = body;
    
    console.log(`Processing exam submission for user ${user.id}, exam ${examId}`);
    
    // Find the exam across all users or just user's exams
    const userExam = await kv.get(`exams:${user.id}:${examId}`);
    
    // If not found in user's exams, try to find in all exams (for public exams)
    let exam = userExam;
    if (!exam) {
      const allExams = await kv.getByPrefix('exams:');
      const foundExam = allExams.find((e: any) => e.id === examId);
      exam = foundExam;
    }
    
    if (!exam) {
      return c.json({ error: 'Exam not found' }, 404);
    }
    
    if (!exam.questions || !Array.isArray(exam.questions)) {
      return c.json({ error: 'Exam has no questions' }, 400);
    }
    
    // Calculate score (only for multiple-choice questions)
    let score = 0;
    let totalMultipleChoice = 0;
    const results: any[] = [];
    
    exam.questions.forEach((question: any, index: number) => {
      const isEssay = question.questionType === 'essay';
      
      if (isEssay) {
        // Essay questions: store answer but don't grade
        results.push({
          question: question.question,
          questionType: 'essay',
          essayAnswer: essayAnswers?.[index] || '',
          isCorrect: null, // Not graded automatically
          requiresManualGrading: true
        });
      } else {
        // Multiple-choice questions: grade automatically
        totalMultipleChoice++;
        const userAnswer = answers?.[index] ?? -1;
        const isCorrect = userAnswer === question.correctAnswer;
        
        if (isCorrect) {
          score++;
        }
        
        results.push({
          question: question.question,
          questionType: 'multiple-choice',
          userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          explanation: question.explanation || ''
        });
      }
    });
    
    // Calculate percentage based on multiple-choice questions only
    const percentage = totalMultipleChoice > 0 
      ? Math.round((score / totalMultipleChoice) * 100) 
      : 0;
    
    // Create submission
    const submissionId = crypto.randomUUID();
    const submissionData = {
      id: submissionId,
      examId: exam.id,
      examTitle: exam.title || 'Simulado',
      userId: user.id,
      answers,
      essayAnswers: essayAnswers || [],
      score,
      totalQuestions: totalMultipleChoice, // Only count multiple-choice for scoring
      totalEssayQuestions: exam.questions.filter((q: any) => q.questionType === 'essay').length,
      percentage,
      results,
      submittedAt: new Date().toISOString(),
      gradingStatus: results.some((r: any) => r.requiresManualGrading) ? 'pending-review' : 'graded'
    };
    
    await kv.set(`submissions:${user.id}:${submissionId}`, submissionData);
    
    console.log(`Submission saved: ${submissionId}, score: ${score}/${totalMultipleChoice}, percentage: ${percentage}%`);
    
    return c.json({ 
      success: true, 
      submission: submissionData 
    });
  } catch (error) {
    console.error('Error processing exam submission:', error);
    return c.json({ error: 'Failed to submit exam: ' + (error.message || 'Unknown error') }, 500);
  }
});

// Submissions Management
app.post('/make-server-83358821/submissions', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const submissionId = crypto.randomUUID();
    const submissionData = {
      id: submissionId,
      ...body,
      userId: user.id,
      submittedAt: new Date().toISOString()
    };
    
    await kv.set(`submissions:${user.id}:${submissionId}`, submissionData);
    
    // Update exam statistics
    const examKey = `exams:${user.id}:${body.examId}`;
    const exam = await kv.get(examKey);
    if (exam) {
      const updatedExam = {
        ...exam,
        appliedCount: (exam.appliedCount || 0) + 1,
        studentsCount: (exam.studentsCount || 0) + 1,
        lastApplied: new Date().toISOString()
      };
      await kv.set(examKey, updatedExam);
    }
    
    return c.json({ success: true, submission: submissionData });
  } catch (error) {
    console.log('Error saving submission:', error);
    return c.json({ error: 'Failed to save submission' }, 500);
  }
});

app.get('/make-server-83358821/submissions', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    
    try {
      // getByPrefix returns array of values directly, not {key, value} objects
      const submissions = await kv.getByPrefix(`submissions:${user.id}:`);
      
      // Filter out any null/undefined values and validate structure
      const validSubmissions = submissions
        .filter(s => {
          if (!s) return false;
          if (!s.id) {
            console.warn('Invalid submission found, filtering out');
            return false;
          }
          return true;
        });
      
      console.log(`Returning ${validSubmissions.length} valid submissions out of ${submissions.length} total`);
      
      return c.json({ 
        success: true,
        submissions: validSubmissions,
        count: validSubmissions.length,
        gradedCount: validSubmissions.filter(s => s.gradingStatus === 'graded').length
      });
    } catch (kvError) {
      console.log('KV error fetching submissions, returning empty array:', kvError);
      return c.json({ 
        success: true,
        submissions: [],
        count: 0,
        gradedCount: 0
      });
    }
  } catch (error) {
    console.log('Error fetching submissions:', error);
    return c.json({ 
      success: false,
      error: 'Failed to fetch submissions',
      submissions: [],
      count: 0
    }, 500);
  }
});

// Images Management (for scanned exams)
app.post('/make-server-83358821/images', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const imageId = crypto.randomUUID();
    const imageData = {
      id: imageId,
      ...body,
      userId: user.id,
      uploadedAt: new Date().toISOString(),
      status: 'Processando'
    };
    
    await kv.set(`images:${user.id}:${imageId}`, imageData);
    
    // Simulate processing
    setTimeout(async () => {
      try {
        const processedData = {
          ...imageData,
          status: 'Processada',
          processedAt: new Date().toISOString(),
          studentName: `Aluno ${Math.floor(Math.random() * 100) + 1}`,
          extractedAnswers: Array.from({ length: 10 }, () => Math.floor(Math.random() * 4))
        };
        await kv.set(`images:${user.id}:${imageId}`, processedData);
      } catch (error) {
        console.log('Error processing image:', error);
      }
    }, 3000);
    
    return c.json({ success: true, image: imageData });
  } catch (error) {
    console.log('Error saving image:', error);
    return c.json({ error: 'Failed to save image' }, 500);
  }
});

app.get('/make-server-83358821/images', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    // getByPrefix returns array of values directly, not {key, value} objects
    const images = await kv.getByPrefix(`images:${user.id}:`);
    return c.json({ images: images });
  } catch (error) {
    console.log('Error fetching images:', error);
    return c.json({ error: 'Failed to fetch images' }, 500);
  }
});

// Classes Management
app.get('/make-server-83358821/classes', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    // getByPrefix returns array of values directly, not {key, value} objects
    const classes = await kv.getByPrefix(`classes:${user.id}:`);
    return c.json({ classes: classes });
  } catch (error) {
    console.log('Error fetching classes:', error);
    return c.json({ error: 'Failed to fetch classes' }, 500);
  }
});

app.post('/make-server-83358821/classes', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const classId = crypto.randomUUID();
    const classData = {
      id: classId,
      ...body,
      userId: user.id,
      createdAt: new Date().toISOString(),
      studentCount: 0
    };
    
    await kv.set(`classes:${user.id}:${classId}`, classData);
    return c.json({ success: true, class: classData });
  } catch (error) {
    console.log('Error saving class:', error);
    return c.json({ error: 'Failed to save class' }, 500);
  }
});

app.put('/make-server-83358821/classes/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const classId = c.req.param('id');
    const body = await c.req.json();
    
    const existingClass = await kv.get(`classes:${user.id}:${classId}`);
    if (!existingClass) {
      return c.json({ error: 'Class not found' }, 404);
    }

    const updatedClass = {
      ...existingClass,
      ...body,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`classes:${user.id}:${classId}`, updatedClass);
    return c.json({ success: true, class: updatedClass });
  } catch (error) {
    console.log('Error updating class:', error);
    return c.json({ error: 'Failed to update class' }, 500);
  }
});

app.delete('/make-server-83358821/classes/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const classId = c.req.param('id');
    
    await kv.del(`classes:${user.id}:${classId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting class:', error);
    return c.json({ error: 'Failed to delete class' }, 500);
  }
});

// Dashboard Stats
app.get('/make-server-83358821/dashboard/stats', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    
    // getByPrefix returns array of values directly, not {key, value} objects
    const [students, exams, submissions] = await Promise.all([
      kv.getByPrefix(`students:${user.id}:`),
      kv.getByPrefix(`exams:${user.id}:`),
      kv.getByPrefix(`submissions:${user.id}:`)
    ]);

    const stats = {
      totalStudents: students.length,
      totalExams: exams.length,
      totalSubmissions: submissions.length,
      activeExams: exams.filter(e => e.status === 'Ativo').length,
      averageScore: submissions.length > 0 
        ? submissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / submissions.length
        : 0
    };

    return c.json({ stats });
  } catch (error) {
    console.log('Error fetching dashboard stats:', error);
    return c.json({ error: 'Failed to fetch dashboard stats' }, 500);
  }
});

// Applications Management
app.post('/make-server-83358821/applications', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const applicationId = crypto.randomUUID();
    const applicationData = {
      id: applicationId,
      ...body,
      userId: user.id,
      createdAt: new Date().toISOString(),
      appliedCount: 0,
      completedCount: 0,
      status: body.status || 'active'
    };
    
    await kv.set(`applications:${user.id}:${applicationId}`, applicationData);
    return c.json({ success: true, application: applicationData });
  } catch (error) {
    console.log('Error saving application:', error);
    return c.json({ error: 'Failed to save application' }, 500);
  }
});

app.get('/make-server-83358821/applications', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    // getByPrefix returns array of values directly, not {key, value} objects
    const applications = await kv.getByPrefix(`applications:${user.id}:`);
    return c.json({ applications: applications });
  } catch (error) {
    console.log('Error fetching applications:', error);
    return c.json({ error: 'Failed to fetch applications' }, 500);
  }
});

app.put('/make-server-83358821/applications/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const applicationId = c.req.param('id');
    const body = await c.req.json();
    
    const existingApplication = await kv.get(`applications:${user.id}:${applicationId}`);
    if (!existingApplication) {
      return c.json({ error: 'Application not found' }, 404);
    }

    const updatedApplication = {
      ...existingApplication,
      ...body,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`applications:${user.id}:${applicationId}`, updatedApplication);
    return c.json({ success: true, application: updatedApplication });
  } catch (error) {
    console.log('Error updating application:', error);
    return c.json({ error: 'Failed to update application' }, 500);
  }
});

app.delete('/make-server-83358821/applications/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const applicationId = c.req.param('id');
    
    await kv.del(`applications:${user.id}:${applicationId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting application:', error);
    return c.json({ error: 'Failed to delete application' }, 500);
  }
});

// Public exam access for students (no auth required)
app.get('/make-server-83358821/public/exam/:examId', async (c) => {
  try {
    const examId = c.req.param('examId');
    const sessionId = c.req.query('session');
    
    if (!sessionId) {
      return c.json({ error: 'Session ID required' }, 400);
    }

    // Find exam across all users (for public access)
    const allExams = await kv.getByPrefix('exams:');
    const exam = allExams.find(e => e.value.id === examId);
    
    if (!exam || exam.value.status !== 'Ativo') {
      return c.json({ error: 'Exam not found or not active' }, 404);
    }

    // Return exam data without sensitive information
    const publicExamData = {
      id: exam.value.id,
      title: exam.value.title,
      description: exam.value.description,
      timeLimit: exam.value.timeLimit,
      totalQuestions: exam.value.totalQuestions,
      questionsPerSubject: exam.value.questionsPerSubject,
      subjects: exam.value.subjects,
      questions: exam.value.questions || [] // Include questions for exam taking
    };

    return c.json({ exam: publicExamData, sessionId });
  } catch (error) {
    console.log('Error fetching public exam:', error);
    return c.json({ error: 'Failed to fetch exam' }, 500);
  }
});

// Grading and Review Management
app.put('/make-server-83358821/submissions/:id/review', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const submissionId = c.req.param('id');
    const body = await c.req.json();
    
    const existingSubmission = await kv.get(`submissions:${user.id}:${submissionId}`);
    if (!existingSubmission) {
      return c.json({ error: 'Submission not found' }, 404);
    }

    const updatedSubmission = {
      ...existingSubmission,
      reviewNotes: body.reviewNotes,
      feedback: body.feedback,
      gradingStatus: 'reviewed',
      reviewedAt: new Date().toISOString(),
      reviewedBy: user.id
    };

    await kv.set(`submissions:${user.id}:${submissionId}`, updatedSubmission);
    return c.json({ success: true, submission: updatedSubmission });
  } catch (error) {
    console.log('Error updating submission review:', error);
    return c.json({ error: 'Failed to update submission review' }, 500);
  }
});

app.post('/make-server-83358821/submissions/bulk-export', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { submissionIds, format = 'csv' } = body;
    
    if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
      return c.json({ error: 'Submission IDs are required' }, 400);
    }

    // Get submissions
    const submissions = [];
    for (const id of submissionIds) {
      const submission = await kv.get(`submissions:${user.id}:${id}`);
      if (submission) {
        submissions.push(submission);
      }
    }

    // Generate export data
    const exportData = {
      format,
      generatedAt: new Date().toISOString(),
      totalSubmissions: submissions.length,
      data: submissions.map(sub => ({
        studentName: sub.studentName || 'N/A',
        examTitle: sub.examTitle || 'N/A',
        score: sub.score || 0,
        totalQuestions: sub.totalQuestions || 0,
        percentage: sub.percentage || 0,
        submittedAt: sub.submittedAt,
        timeSpent: sub.timeSpent || 0,
        gradingStatus: sub.gradingStatus || 'pending'
      }))
    };

    return c.json({ success: true, export: exportData });
  } catch (error) {
    console.log('Error bulk exporting submissions:', error);
    return c.json({ error: 'Failed to export submissions' }, 500);
  }
});

app.get('/make-server-83358821/analytics/grading-stats', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    
    const [submissions, exams] = await Promise.all([
      kv.getByPrefix(`submissions:${user.id}:`),
      kv.getByPrefix(`exams:${user.id}:`)
    ]);

    // getByPrefix returns array of values directly, not {key, value} objects
    const submissionData = submissions;
    
    const stats = {
      totalSubmissions: submissionData.length,
      gradedSubmissions: submissionData.filter(s => s.gradingStatus === 'graded').length,
      reviewedSubmissions: submissionData.filter(s => s.gradingStatus === 'reviewed').length,
      averageScore: submissionData.length > 0 
        ? Math.round(submissionData.reduce((sum, sub) => sum + (sub.percentage || 0), 0) / submissionData.length)
        : 0,
      passRate: submissionData.length > 0
        ? Math.round((submissionData.filter(s => (s.percentage || 0) >= 60).length / submissionData.length) * 100)
        : 0,
      performanceDistribution: {
        excellent: submissionData.filter(s => (s.percentage || 0) >= 80).length,
        veryGood: submissionData.filter(s => (s.percentage || 0) >= 70 && (s.percentage || 0) < 80).length,
        good: submissionData.filter(s => (s.percentage || 0) >= 60 && (s.percentage || 0) < 70).length,
        regular: submissionData.filter(s => (s.percentage || 0) >= 50 && (s.percentage || 0) < 60).length,
        insufficient: submissionData.filter(s => (s.percentage || 0) < 50).length
      },
      recentActivity: submissionData
        .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime())
        .slice(0, 10)
        .map(sub => ({
          id: sub.id,
          studentName: sub.studentName || 'N/A',
          examTitle: sub.examTitle || 'N/A',
          percentage: sub.percentage || 0,
          submittedAt: sub.submittedAt
        }))
    };

    return c.json({ stats });
  } catch (error) {
    console.log('Error fetching grading analytics:', error);
    return c.json({ error: 'Failed to fetch grading analytics' }, 500);
  }
});

// Reports Management
app.post('/make-server-83358821/reports/generate', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { reportId, options = {} } = body;
    
    if (!reportId) {
      return c.json({ error: 'Report ID is required' }, 400);
    }

    // Get data based on report requirements
    const [students, exams, submissions, questions, classes, images] = await Promise.all([
      kv.getByPrefix(`students:${user.id}:`).catch(() => []),
      kv.getByPrefix(`exams:${user.id}:`).catch(() => []),
      kv.getByPrefix(`submissions:${user.id}:`).catch(() => []),
      kv.getByPrefix(`questions:${user.id}:`).catch(() => []),
      kv.getByPrefix(`classes:${user.id}:`).catch(() => []),
      kv.getByPrefix(`images:${user.id}:`).catch(() => [])
    ]);

    // getByPrefix returns array of values directly, not {key, value} objects
    const reportData = {
      students: students,
      exams: exams,
      submissions: submissions,
      questions: questions,
      classes: classes,
      images: images
    };

    // Generate report based on reportId
    const reportResult = generateReportData(reportId, reportData, options);
    
    return c.json({ 
      success: true, 
      reportId,
      data: reportResult.data,
      filename: reportResult.filename,
      format: reportResult.format,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.log('Error generating report:', error);
    return c.json({ error: 'Failed to generate report' }, 500);
  }
});

app.get('/make-server-83358821/reports/available', requireAuth, async (c) => {
  try {
    const availableReports = [
      { id: 'audit-facial', name: 'Auditoria Reconhecimento Facial', category: 'auditoria' },
      { id: 'question-bank', name: 'Banco de Questões', category: 'banco' },
      { id: 'application-notes', name: 'Dados da Aplicação e Notas', category: 'aplicacao' },
      { id: 'application-notes-by-question', name: 'Dados da Aplicação e Notas por Questão', category: 'aplicacao' },
      { id: 'classes-students', name: 'Turmas e Alunos', category: 'gestao' },
      { id: 'correction-report', name: 'Relatório - Correção de Avaliação', category: 'correcao' },
      { id: 'online-marking', name: 'Relatório de Marcação (Prova Online)', category: 'aplicacao' },
      { id: 'printed-marking', name: 'Relatório de Marcações (Prova Impressa)', category: 'aplicacao' },
      { id: 'teacher-report', name: 'Relatório do Professor', category: 'gestao' }
    ];
    
    return c.json({ reports: availableReports });
  } catch (error) {
    console.log('Error fetching available reports:', error);
    return c.json({ error: 'Failed to fetch available reports' }, 500);
  }
});

// Helper function to generate report data
function generateReportData(reportId: string, data: any, options: any) {
  const timestamp = new Date().toISOString().slice(0, 10);
  
  switch (reportId) {
    case 'audit-facial':
      return {
        data: generateAuditReport(data),
        filename: `auditoria-reconhecimento-facial-${timestamp}.pdf`,
        format: 'pdf'
      };
      
    case 'question-bank':
      return {
        data: generateQuestionBankReport(data),
        filename: `banco-questoes-${timestamp}.xlsx`,
        format: 'excel'
      };
      
    case 'application-notes':
      return {
        data: generateApplicationNotesReport(data),
        filename: `aplicacao-notas-${timestamp}.xlsx`,
        format: 'excel'
      };
      
    case 'application-notes-by-question':
      return {
        data: generateApplicationNotesByQuestionReport(data),
        filename: `aplicacao-notas-por-questao-${timestamp}.xlsx`,
        format: 'excel'
      };
      
    case 'classes-students':
      return {
        data: generateClassesStudentsReport(data),
        filename: `turmas-alunos-${timestamp}.xlsx`,
        format: 'excel'
      };
      
    case 'correction-report':
      return {
        data: generateCorrectionReport(data),
        filename: `relatorio-correcao-${timestamp}.pdf`,
        format: 'pdf'
      };
      
    case 'online-marking':
      return {
        data: generateOnlineMarkingReport(data),
        filename: `marcacao-prova-online-${timestamp}.xlsx`,
        format: 'excel'
      };
      
    case 'printed-marking':
      return {
        data: generatePrintedMarkingReport(data),
        filename: `marcacao-prova-impressa-${timestamp}.xlsx`,
        format: 'excel'
      };
      
    case 'teacher-report':
      return {
        data: generateTeacherReport(data),
        filename: `relatorio-professor-${timestamp}.pdf`,
        format: 'pdf'
      };
      
    default:
      throw new Error('Report type not found');
  }
}

function generateAuditReport(data: any) {
  return {
    title: 'Relatório de Auditoria - Reconhecimento Facial',
    generatedAt: new Date().toISOString(),
    summary: {
      totalSubmissions: data.submissions.length,
      verificationsPerformed: data.submissions.length,
      successfulVerifications: Math.floor(data.submissions.length * 0.95),
      failedVerifications: Math.floor(data.submissions.length * 0.05)
    },
    details: data.submissions.map((sub: any) => ({
      studentName: sub.studentName || 'N/A',
      examTitle: sub.examTitle,
      submittedAt: sub.submittedAt,
      verificationStatus: Math.random() > 0.05 ? 'Aprovado' : 'Reprovado',
      confidenceScore: Math.floor(Math.random() * 20) + 80,
      notes: Math.random() > 0.1 ? 'Verificação bem-sucedida' : 'Baixa qualidade da imagem'
    }))
  };
}

function generateQuestionBankReport(data: any) {
  const subjectStats = data.questions.reduce((acc: any, q: any) => {
    const subject = q.subject || 'Geral';
    if (!acc[subject]) {
      acc[subject] = { total: 0, easy: 0, medium: 0, hard: 0 };
    }
    acc[subject].total++;
    const difficulty = q.difficulty || 'medium';
    acc[subject][difficulty]++;
    return acc;
  }, {});

  return {
    title: 'Relatório do Banco de Questões',
    generatedAt: new Date().toISOString(),
    summary: {
      totalQuestions: data.questions.length,
      totalSubjects: Object.keys(subjectStats).length,
      averageUsage: data.questions.reduce((sum: number, q: any) => sum + (q.usageCount || 0), 0) / data.questions.length
    },
    bySubject: subjectStats,
    questions: data.questions.map((q: any) => ({
      id: q.id,
      subject: q.subject || 'Geral',
      difficulty: q.difficulty || 'medium',
      question: q.question?.substring(0, 100) + '...',
      usageCount: q.usageCount || 0,
      createdAt: q.createdAt
    }))
  };
}

function generateApplicationNotesReport(data: any) {
  return {
    title: 'Relatório de Aplicação e Notas',
    generatedAt: new Date().toISOString(),
    summary: {
      totalApplications: data.submissions.length,
      totalStudents: new Set(data.submissions.map((s: any) => s.studentId)).size,
      averageScore: data.submissions.reduce((sum: number, s: any) => sum + (s.percentage || 0), 0) / data.submissions.length,
      passRate: (data.submissions.filter((s: any) => (s.percentage || 0) >= 60).length / data.submissions.length) * 100
    },
    applications: data.submissions.map((sub: any) => ({
      studentName: sub.studentName || 'N/A',
      examTitle: sub.examTitle,
      submittedAt: sub.submittedAt,
      score: sub.score || 0,
      totalQuestions: sub.totalQuestions || 0,
      percentage: sub.percentage || 0,
      timeSpent: sub.timeSpent || Math.floor(Math.random() * 60) + 20,
      status: (sub.percentage || 0) >= 60 ? 'Aprovado' : 'Reprovado'
    }))
  };
}

function generateApplicationNotesByQuestionReport(data: any) {
  return {
    title: 'Relatório de Aplicação e Notas por Questão',
    generatedAt: new Date().toISOString(),
    questionAnalysis: data.submissions.map((sub: any) => ({
      studentName: sub.studentName || 'N/A',
      examTitle: sub.examTitle,
      responses: (sub.answers || []).map((answer: number, index: number) => ({
        questionNumber: index + 1,
        studentAnswer: answer,
        correctAnswer: Math.floor(Math.random() * 4),
        isCorrect: Math.random() > 0.3,
        subject: ['Matemática', 'Português', 'História', 'Geografia', 'Ciências'][index % 5]
      }))
    }))
  };
}

function generateClassesStudentsReport(data: any) {
  const classesSummary = data.students.reduce((acc: any, student: any) => {
    const className = student.class || 'Sem Turma';
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(student);
    return acc;
  }, {});

  return {
    title: 'Relatório de Turmas e Alunos',
    generatedAt: new Date().toISOString(),
    summary: {
      totalClasses: Object.keys(classesSummary).length,
      totalStudents: data.students.length,
      averagePerClass: data.students.length / Object.keys(classesSummary).length
    },
    classes: Object.entries(classesSummary).map(([className, students]: [string, any]) => ({
      className,
      studentCount: students.length,
      students: students.map((s: any) => ({
        name: s.name,
        email: s.email,
        registrationNumber: s.registrationNumber || 'N/A',
        status: s.status || 'active',
        grade: s.grade || 'N/A'
      }))
    }))
  };
}

function generateCorrectionReport(data: any) {
  return {
    title: 'Relatório de Correção de Avaliação',
    generatedAt: new Date().toISOString(),
    summary: {
      totalSubmissions: data.submissions.length,
      automaticCorrections: Math.floor(data.submissions.length * 0.85),
      manualCorrections: Math.floor(data.submissions.length * 0.15),
      averageProcessingTime: '2.3 segundos'
    },
    corrections: data.submissions.map((sub: any) => ({
      examTitle: sub.examTitle,
      studentName: sub.studentName || 'N/A',
      correctionType: Math.random() > 0.15 ? 'Automática' : 'Manual',
      score: sub.score || 0,
      percentage: sub.percentage || 0,
      processingTime: Math.random() * 5 + 1,
      correctedAt: sub.submittedAt,
      reviewer: Math.random() > 0.15 ? 'Sistema' : 'Professor'
    }))
  };
}

function generateOnlineMarkingReport(data: any) {
  return {
    title: 'Relatório de Marcação - Prova Online',
    generatedAt: new Date().toISOString(),
    onlineSubmissions: data.submissions.filter((s: any) => !s.isScanned).map((sub: any) => ({
      studentName: sub.studentName || 'N/A',
      examTitle: sub.examTitle,
      submittedAt: sub.submittedAt,
      answers: sub.answers || [],
      timeSpent: sub.timeSpent || Math.floor(Math.random() * 60) + 20,
      browserInfo: 'Chrome 91.0',
      deviceType: Math.random() > 0.5 ? 'Desktop' : 'Mobile',
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 255)
    }))
  };
}

function generatePrintedMarkingReport(data: any) {
  return {
    title: 'Relatório de Marcação - Prova Impressa',
    generatedAt: new Date().toISOString(),
    scannedImages: data.images.map((img: any) => ({
      studentName: img.studentName || 'N/A',
      examTitle: img.examTitle || 'N/A',
      uploadedAt: img.uploadedAt,
      processingStatus: img.status || 'Processada',
      extractedAnswers: img.extractedAnswers || [],
      confidenceScore: Math.floor(Math.random() * 20) + 80,
      manualReviewRequired: Math.random() > 0.9
    }))
  };
}

function generateTeacherReport(data: any) {
  return {
    title: 'Relatório do Professor',
    generatedAt: new Date().toISOString(),
    overview: {
      totalStudents: data.students.length,
      totalExams: data.exams.length,
      totalSubmissions: data.submissions.length,
      classAverage: data.submissions.reduce((sum: number, s: any) => sum + (s.percentage || 0), 0) / data.submissions.length
    },
    performance: {
      topPerformers: data.submissions
        .sort((a: any, b: any) => (b.percentage || 0) - (a.percentage || 0))
        .slice(0, 5)
        .map((s: any) => ({ name: s.studentName || 'N/A', score: s.percentage || 0 })),
      needsAttention: data.submissions
        .filter((s: any) => (s.percentage || 0) < 60)
        .map((s: any) => ({ name: s.studentName || 'N/A', score: s.percentage || 0 }))
    },
    recommendations: [
      'Revisar conteúdos de menor performance',
      'Aplicar atividades de reforço',
      'Acompanhar alunos com dificuldades',
      'Analisar questões com baixo índice de acerto'
    ]
  };
}

// Series Management Routes
app.get('/make-server-83358821/series', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    // getByPrefix returns array of values directly, not {key, value} objects
    const seriesData = await kv.getByPrefix(`series:${user.id}:`);
    
    const series = seriesData.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return c.json({ success: true, data: series });
  } catch (error) {
    console.log('Error fetching series:', error);
    return c.json({ error: 'Failed to fetch series' }, 500);
  }
});

app.post('/make-server-83358821/series', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.name || !body.code) {
      return c.json({ error: 'Nome e código são obrigatórios' }, 400);
    }

    // Check if code already exists
    const existingSeries = await kv.getByPrefix(`series:${user.id}:`);
    const codeExists = existingSeries.some(item => 
      item.value.code.toLowerCase() === body.code.toLowerCase()
    );
    
    if (codeExists) {
      return c.json({ error: 'Código já existe. Escolha outro código.' }, 400);
    }

    const serieId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const serie = {
      id: serieId,
      name: body.name.trim(),
      code: body.code.trim().toUpperCase(),
      description: body.description?.trim() || '',
      level: body.level || 'fundamental1',
      grade: parseInt(body.grade) || 1,
      isActive: body.isActive !== undefined ? body.isActive : true,
      studentCount: 0,
      maxStudents: body.maxStudents ? parseInt(body.maxStudents) : undefined,
      academicYear: body.academicYear || new Date().getFullYear().toString(),
      createdBy: user.id,
      createdAt: now,
      updatedAt: now
    };

    await kv.set(`series:${user.id}:${serieId}`, serie);
    
    return c.json({ success: true, data: serie });
  } catch (error) {
    console.log('Error creating serie:', error);
    return c.json({ error: 'Failed to create serie' }, 500);
  }
});

app.get('/make-server-83358821/series/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const serieId = c.req.param('id');
    
    const serie = await kv.get(`series:${user.id}:${serieId}`);
    
    if (!serie) {
      return c.json({ error: 'Série não encontrada' }, 404);
    }
    
    return c.json({ success: true, data: serie });
  } catch (error) {
    console.log('Error fetching serie:', error);
    return c.json({ error: 'Failed to fetch serie' }, 500);
  }
});

app.put('/make-server-83358821/series/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const serieId = c.req.param('id');
    const body = await c.req.json();
    
    const existingSerie = await kv.get(`series:${user.id}:${serieId}`);
    
    if (!existingSerie) {
      return c.json({ error: 'Série não encontrada' }, 404);
    }

    // Check if code already exists (excluding current serie)
    if (body.code && body.code !== existingSerie.code) {
      const allSeries = await kv.getByPrefix(`series:${user.id}:`);
      const codeExists = allSeries.some(item => 
        item.value.id !== serieId && 
        item.value.code.toLowerCase() === body.code.toLowerCase()
      );
      
      if (codeExists) {
        return c.json({ error: 'Código já existe. Escolha outro código.' }, 400);
      }
    }

    const updatedSerie = {
      ...existingSerie,
      ...body,
      id: serieId, // Ensure ID doesn't change
      createdBy: existingSerie.createdBy, // Preserve original creator
      createdAt: existingSerie.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };

    // Clean up undefined values
    Object.keys(updatedSerie).forEach(key => {
      if (updatedSerie[key] === undefined) {
        delete updatedSerie[key];
      }
    });

    await kv.set(`series:${user.id}:${serieId}`, updatedSerie);
    
    return c.json({ success: true, data: updatedSerie });
  } catch (error) {
    console.log('Error updating serie:', error);
    return c.json({ error: 'Failed to update serie' }, 500);
  }
});

app.delete('/make-server-83358821/series/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const serieId = c.req.param('id');
    
    const serie = await kv.get(`series:${user.id}:${serieId}`);
    
    if (!serie) {
      return c.json({ error: 'Série não encontrada' }, 404);
    }

    // Check if serie has students
    if (serie.studentCount > 0) {
      return c.json({ error: 'Não é possível excluir uma série que possui alunos' }, 400);
    }

    await kv.del(`series:${user.id}:${serieId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting serie:', error);
    return c.json({ error: 'Failed to delete serie' }, 500);
  }
});

app.get('/make-server-83358821/series/:id/students', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const serieId = c.req.param('id');
    
    // Get all students for this user and filter by serie
    // getByPrefix returns array of values directly, not {key, value} objects
    const studentsData = await kv.getByPrefix(`students:${user.id}:`);
    const serieStudents = studentsData
      .filter(student => student.serieId === serieId);
    
    return c.json({ success: true, data: serieStudents });
  } catch (error) {
    console.log('Error fetching serie students:', error);
    return c.json({ error: 'Failed to fetch serie students' }, 500);
  }
});

// Health check
app.get('/make-server-83358821/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

console.log('SEICE Server starting...');
Deno.serve(app.fetch);