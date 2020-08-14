export const esIndexDef = {
  mappings: {
    dynamic: false,
    properties: {
      timetableId: {
        type: 'integer',
      },
      courseId: {
        type: 'integer',
      },
      credits: {
        type: 'integer',
      },
      flags: {
        type: 'keyword',
      },
      categories: {
        properties: {
          available: {
            type: 'boolean',
          },
          year: {
            type: 'byte',
          },
          semester: {
            type: 'keyword',
          },
          faculty: {
            type: 'keyword',
          },
          program: {
            type: 'keyword',
          },
          category: {
            type: 'keyword',
          },
          schedule: {
            properties: {
              type: {
                type: 'keyword',
              },
              days: {
                properties: {
                  date: {
                    type: 'byte',
                  },
                  hour: {
                    type: 'byte',
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
      code: {
        type: 'keyword',
      },
      class: {
        type: 'keyword',
      },
      title: {
        type: 'text',
      },
      instructors: {
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
        properties: {
          description: {
            type: 'text',
          },
          evaluations: {
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
      attachments: {
        properties: {
          name: {
            type: 'text',
          },
          key: {
            type: 'keyword',
          },
        },
      },
    },
  },
};
