const axios = require('axios');

/**
 * Service to interact with the llama-cpp server
 */
class LlamaService {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    console.log(`LlamaService initialized with server URL: ${this.serverUrl}`);
  }

  /**
   * Generate a quiz using the llama-cpp server
   */
  async generateQuiz(topic, numQuestions, difficulty, exam) {
    try {
      console.log(`Generating quiz for topic: ${topic}, questions: ${numQuestions}`);
      
      // Validate LLM server URL
      if (!this.serverUrl) {
        throw new Error('LLM server URL is not configured.');
      }

      // For large question counts, break into smaller batches to avoid timeouts
      if (numQuestions > 3) {
        console.log(`Breaking down request for ${numQuestions} questions into smaller batches`);
        return this.generateQuizInBatches(topic, numQuestions, difficulty, exam);
      }
      
      // For small question counts, use direct generation
      console.log(`Using direct generation for ${numQuestions} questions`);
      try {
        const result = await this.generateBatch(topic, numQuestions, difficulty, exam);
        
        if (result && result.length > 0) {
          console.log(`Successfully generated ${result.length} questions`);
          return result.slice(0, numQuestions);
        }
      } catch (error) {
        console.warn(`Generation failed: ${error.message}`);
      }
      
      // If we get here without returning, use fallback
      return this.generateFallbackQuestions(topic, difficulty, numQuestions);
    } catch (error) {
      console.error('Error calling LLM service:', error);
      return this.generateFallbackQuestions(topic, difficulty, numQuestions);
    }
  }

  /**
   * Generate quiz questions in smaller batches to avoid timeout issues
   */
  async generateQuizInBatches(topic, numQuestions, difficulty, exam) {
    const BATCH_SIZE = 2; // Generate 2 questions per batch
    const maxBatches = Math.ceil(numQuestions / BATCH_SIZE) + 1; // Allow extra batch for uniqueness
    const allQuestions = [];
    let batchCount = 0;
    
    console.log(`Generating ${numQuestions} questions in up to ${maxBatches} batches of ${BATCH_SIZE}`);
    
    // Generate batches until we have enough unique questions or hit max batches
    while (allQuestions.length < numQuestions && batchCount < maxBatches) {
      const remainingQuestions = numQuestions - allQuestions.length;
      const batchSize = Math.min(BATCH_SIZE, remainingQuestions);
      
      if (batchSize <= 0) break;
      
      batchCount++;
      console.log(`Generating batch ${batchCount}/${maxBatches} with ${batchSize} questions`);
      
      try {
        const questions = await this.generateBatch(topic, batchSize, difficulty, exam, allQuestions.map(q => q.question));
        
        if (questions && questions.length > 0) {
          allQuestions.push(...questions);
          console.log(`Batch ${batchCount} complete with ${questions.length} questions. Total: ${allQuestions.length}/${numQuestions}`);
        }
        
        // Wait between batches to avoid overwhelming the LLM
        if (batchCount < maxBatches && allQuestions.length < numQuestions) {
          console.log(`Waiting 2 seconds before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.warn(`Batch ${batchCount} failed: ${error.message}`);
      }
    }
    
    // Ensure no duplicates with normalized question text
    const uniqueQuestions = [];
    const questionTexts = new Set();
    
    for (const question of allQuestions) {
      // Normalize question text: lowercase, remove punctuation, standardize synonyms
      let normalizedText = question.question.toLowerCase()
        .replace(/[?.,!]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Normalize spaces
        .replace('rajgir', 'rajagriha') // Standardize place names
        .trim();
      
      if (!questionTexts.has(normalizedText)) {
        questionTexts.add(normalizedText);
        uniqueQuestions.push(question);
      } else {
        console.log(`Skipping duplicate question: ${question.question}`);
      }
    }
    
    // If we don't have enough unique questions, use fallbacks
    if (uniqueQuestions.length < numQuestions) {
      const remainingQuestionsNeeded = numQuestions - uniqueQuestions.length;
      console.warn(`Only generated ${uniqueQuestions.length}/${numQuestions} unique questions, need ${remainingQuestionsNeeded} more`);
      
      const fallbacks = this.generateFallbackQuestions(topic, difficulty, remainingQuestionsNeeded);
      uniqueQuestions.push(...fallbacks);
    }
    
    console.log(`Returning ${uniqueQuestions.length} unique questions (out of ${allQuestions.length} total)`);
    
    // Return exactly the number of questions requested
    return uniqueQuestions.slice(0, numQuestions);
  }

  /**
   * Generate a single batch of questions
   */
  async generateBatch(topic, numQuestions, difficulty, exam, existingQuestions = []) {
    // Create a strict prompt with an example to enforce plain text output
    const difficultyStr = difficulty || 'Medium';
    const examStr = exam || 'general';
    const existingQuestionsStr = existingQuestions.length > 0 
      ? `Do not generate questions similar to: ${existingQuestions.join('; ')}.` 
      : '';
    
    const prompt = `This is an quiz app app for educational purpose who are preparing for exams and do a last minute revision, so keeping that in mind, Generate exactly ${numQuestions} multiple-choice quiz questions about ${topic} for ${difficultyStr} difficulty ${examStr} exam. Each question must have exactly 4 options (A, B, C, D) and one correct answer. Each question must cover a completely distinct event, figure, or aspect of ${topic} to ensure diversity (e.g., do not repeat questions about the definition of a Mahajanapada). ${existingQuestionsStr} Ensure all answers are factually accurate and verified against historical records. Return the output in the following plain text format with no extra text before or after:

Example:
Question 1: What is a binary tree?
A) A tree with at most two children per node
B) A tree with one child per node
C) A linear data structure
D) A graph with cycles
Correct Answer: A

Question 1: [Question text]?
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Correct Answer: [A/B/C/D]

Question 2: [Question text]?
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Correct Answer: [A/B/C/D]

Ensure each question ends with a question mark and the correct answer is indicated as 'Correct Answer: [A/B/C/D]' with only the letter (A, B, C, or D). Under no circumstances include introductory text, explanations, or additional text before or after the questions. Do not generate more or fewer than ${numQuestions} questions.`;

    console.log(`Sending request to LLM server at: ${this.serverUrl}/v1/chat/completions`);
    
    const maxAttempts = 3; // Number of retry attempts
    let attempt = 1;
    
    while (attempt <= maxAttempts) {
      try {
        const response = await axios.post(`${this.serverUrl}/v1/chat/completions`, {
          model: "llama-2-7b-chat.Q4_K_M.gguf",
          messages: [
            { 
              role: "system", 
              content: "You are a quiz generator that returns exactly the requested number of distinct questions in a specific plain text format with no extra text." 
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.1, // Lower for more deterministic responses
          max_tokens: numQuestions * 256, // Adjust tokens based on number of questions
          top_p: 0.9 // Slightly stricter
        }, {
          timeout: 90000, // 90 seconds
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Received response from LLM server');
        
        if (!response.data?.choices?.[0]?.message?.content) {
          throw new Error('Invalid response structure from LLM server');
        }

        const content = response.data.choices[0].message.content;
        console.log('Raw LLM response:', content); // Log raw response for debugging
        
        // Skip initial validation to rely on parsing logic
        // Log content details for debugging
        console.log(`Content length: ${content.length}, First 50 chars: ${content.slice(0, 50)}`);

        // Try parsing as JSON first
        try {
          const cleanedContent = content
            .replace(/```json/g, '') // Remove markdown code block markers
            .replace(/```/g, '')
            .replace(/^\s*[\r\n]*/gm, '') // Remove leading/trailing whitespace and newlines
            .replace(/\/\/.*$/gm, '') // Remove comments
            .trim();
            
          const fixedJson = cleanedContent
            .replace(/,\s*}/g, '}') // Remove trailing commas in objects
            .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
            .replace(/(\w+):/g, '"$1":') // Add quotes around keys
            .replace(/'([^']*)'/g, '"$1"'); // Replace single quotes with double quotes
          
          const parsedArray = JSON.parse(fixedJson);
          
          if (Array.isArray(parsedArray)) {
            const validQuestions = parsedArray.filter(item => 
              item?.question &&
              item?.options &&
              typeof item.options === 'object' &&
              ['A', 'B', 'C', 'D'].every(opt => opt in item.options) &&
              item?.answer &&
              ['A', 'B', 'C', 'D'].includes(item.answer)
            ).slice(0, numQuestions); // Limit to numQuestions
            
            if (validQuestions.length > 0) {
              console.log(`Successfully extracted ${validQuestions.length} valid questions from JSON`);
              return validQuestions;
            }
          }
        } catch (jsonError) {
          console.warn('JSON parsing failed, attempting text parsing:', jsonError.message);
        }

        // Parse plain text response
        const questions = [];
        // Normalize newlines
        const normalizedContent = content.replace(/\r\n/g, '\n');
        // Split by 'Question \d+:' to separate questions
        const questionBlocks = normalizedContent.split(/(?=^Question \d+:)/m).filter(block => block.trim().startsWith('Question'));
        
        for (const block of questionBlocks) {
          try {
            const lines = block.split('\n').map(line => line.trim()).filter(line => line);
            // Require at least question + 4 options
            if (lines.length < 5) {
              console.warn(`Skipping block due to insufficient lines (${lines.length}):`, block);
              continue;
            }
            
            const questionMatch = lines[0].match(/^Question \d+: (.+)/);
            if (!questionMatch) {
              console.warn('Skipping block due to invalid question format:', lines[0]);
              continue;
            }
            
            let questionText = questionMatch[1];
            if (!questionText.endsWith('?')) questionText += '?';
            
            const options = {};
            let answer = null;
            
            // Extract options (lines 1-4 should be options)
            for (let i = 1; i <= 4; i++) {
              if (i >= lines.length) {
                console.warn(`Missing option at index ${i} in block:`, block);
                break;
              }
              const optionLine = lines[i];
              const match = optionLine.match(/^[A-D]\)\s*(.+)$/);
              if (match) {
                options[match[0][0]] = match[1];
              } else {
                console.warn(`Invalid option format at line ${i}:`, optionLine);
              }
            }
            
            // Extract correct answer (if present)
            if (lines.length >= 6) {
              const answerLine = lines[5];
              const answerMatch = answerLine.match(/^Correct Answer: ([A-D])(?:\)|$)/);
              if (answerMatch) {
                answer = answerMatch[1];
              } else {
                console.warn('No valid correct answer found, defaulting to A:', answerLine);
                answer = 'A';
              }
            } else {
              console.warn('No correct answer line found, defaulting to A');
              answer = 'A';
            }
            
            if (Object.keys(options).length === 4 && answer) {
              questions.push({
                question: questionText,
                options,
                answer
              });
            } else {
              console.warn('Skipping block due to incomplete options or answer:', block);
            }
          } catch (err) {
            console.warn('Failed to parse question block:', err.message, block);
          }
          
          // Stop parsing if we have enough questions
          if (questions.length >= numQuestions) {
            break;
          }
        }

        // Validate number of questions
        if (questions.length > numQuestions) {
          console.warn(`Received ${questions.length} questions, expected ${numQuestions}, truncating`);
          questions.length = numQuestions;
        } else if (questions.length < numQuestions) {
          throw new Error(`Received ${questions.length} questions, expected ${numQuestions}`);
        }

        console.log(`Successfully extracted ${questions.length} questions from text parsing`);
        return questions;
        
      } catch (error) {
        console.error(`Attempt ${attempt} failed: ${error.message}`);
        if (attempt === maxAttempts) {
          throw error; // Rethrow on final attempt
        }
        attempt++;
        console.log(`Retrying request (attempt ${attempt}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }
  }

  /**
   * Generate fallback questions when LLM fails
   */
  generateFallbackQuestions(topic, difficulty, count = 1) {
    console.log(`Generating ${count} fallback questions for ${topic}`);
    
    const questions = [];
    
    // Create a set of generic questions for this topic
    for (let i = 0; i < count; i++) {
      questions.push({
        "question": `What is an important aspect of ${topic}?`,
        "options": {
          "A": `The history of ${topic}`,
          "B": `The principles of ${topic}`,
          "C": `The applications of ${topic}`,
          "D": `The development of ${topic}`
        },
        "answer": "B"
      });
    }
    
    return questions;
  }

  /**
   * Check if the LLM server is available
   */
  async checkHealth() {
    try {
      console.log(`Checking LLM server health at: ${this.serverUrl}`);
      
      const response = await axios.get(`${this.serverUrl}/v1/models`, {
        timeout: 10000 // 10 second timeout
      });
      
      console.log('LLM server health check response:', response.status);
      
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.error('LLM server health check failed:', error.message);
      return false;
    }
  }
}

module.exports = LlamaService;