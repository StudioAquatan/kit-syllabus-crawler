import type {
  IndicesCreateRequest,
  IndicesIndexSettings,
  MappingTypeMapping,
} from '@elastic/elasticsearch/lib/api/types';

const indexSetting: IndicesIndexSettings = {
  index: {
    analysis: {
      analyzer: {
        default: {
          type: 'custom',
          char_filter: ['icu_normalizer'],
          tokenizer: 'kuromoji_tokenizer',
          filter: [
            'kuromoji_baseform',
            'kuromoji_part_of_speech',
            'cjk_width',
            'ja_stop',
            'kuromoji_stemmer',
            'lowercase',
          ],
        },
        reading_form: {
          type: 'custom',
          char_filter: ['icu_normalizer'],
          tokenizer: 'kuromoji_tokenizer_search',
          filter: [
            'kuromoji_baseform',
            'kuromoji_part_of_speech',
            'cjk_width',
            'stop',
            'ja_stop',
            'kuromoji_stemmer',
            'kuromoji_no_romaji_readingform',
            'kana_filter',
            'lowercase',
          ],
        },
        kuromoji_completion_index: {
          // @ts-expect-error kuromoji_completion
          mode: 'index',
          // @ts-expect-error kuromoji_completion
          type: 'kuromoji_completion',
        },
        kuromoji_completion_query: {
          // @ts-expect-error kuromoji_completion
          mode: 'query',
          // @ts-expect-error kuromoji_completion
          type: 'kuromoji_completion',
        },
      },
    },
  },
};

const subjectMapping: MappingTypeMapping['properties'] = {
  id: {
    type: 'integer',
  },
  timetableId: {
    type: 'keyword',
  },
  courseId: {
    type: 'keyword',
  },
  credits: {
    type: 'integer',
  },
  code: {
    type: 'keyword',
    index: false,
  },
  flags: {
    type: 'keyword',
  },
  categories: {
    type: 'nested',
    properties: {
      available: {
        type: 'boolean',
      },
      year: {
        type: 'integer',
      },
      semester: {
        type: 'keyword',
      },
      faculty: {
        type: 'keyword',
      },
      field: {
        type: 'keyword',
      },
      program: {
        type: 'keyword',
      },
      category: {
        type: 'keyword',
      },
      schedule: {
        type: 'object',
        properties: {
          type: {
            type: 'keyword',
          },
          days: {
            type: 'nested',
            properties: {
              date: {
                type: 'integer',
              },
              hour: {
                type: 'integer',
              },
            },
          },
        },
      },
    },
  },
  type: {
    type: 'keyword',
  },
  class: {
    type: 'keyword',
  },
  title: {
    type: 'text',
    fields: {
      reading: {
        type: 'text',
        analyzer: 'reading_form',
      },
    },
  },
  instructors: {
    type: 'nested',
    properties: {
      id: {
        type: 'keyword',
      },
      name: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
          },
        },
      },
    },
  },
  outline: {
    type: 'text',
  },
  purpose: {
    type: 'text',
  },
  requirement: {
    type: 'text',
  },
  point: {
    type: 'text',
  },
  textbook: {
    type: 'text',
  },
  gradingPolicy: {
    type: 'text',
  },
  remark: {
    type: 'text',
  },
  researchPlan: {
    type: 'text',
  },
  plans: {
    type: 'nested',
    properties: {
      topic: {
        type: 'text',
      },
      content: {
        type: 'text',
      },
    },
  },
  goal: {
    type: 'object',
    properties: {
      description: {
        type: 'text',
      },
      evaluations: {
        type: 'nested',
        properties: {
          label: {
            type: 'text',
          },
          description: {
            type: 'text',
          },
        },
      },
    },
  },
  completion: {
    type: 'completion',
    analyzer: 'kuromoji_completion_index',
    search_analyzer: 'kuromoji_completion_query',
    preserve_separators: false,
    preserve_position_increments: true,
    max_input_length: 50,
    contexts: [
      {
        name: 'faculty',
        type: 'category',
      },
      {
        name: 'field',
        type: 'category',
      },
      {
        name: 'program',
        type: 'category',
      },
      {
        name: 'category',
        type: 'category',
      },
      {
        name: 'year',
        type: 'category',
      },
      {
        name: 'semester',
        type: 'category',
      },
    ],
  },
};

export function createCreateIndexRequest(
  indexName: string,
): IndicesCreateRequest {
  return {
    index: indexName,
    settings: indexSetting,
    mappings: {
      properties: subjectMapping,
    },
  };
}
