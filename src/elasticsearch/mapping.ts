import {
  IndicesCreateRequest,
  IndicesIndexSettings,
  MappingTypeMapping,
} from '@elastic/elasticsearch/lib/api/types';

const indexSetting: IndicesIndexSettings = {
  index: {
    analysis: {
      analyzer: {
        kuromoji_normalize: {
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
    type: 'search_as_you_type',
  },
  instructors: {
    type: 'nested',
    properties: {
      id: {
        type: 'keyword',
      },
      name: {
        type: 'text',
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
