/* global module */
module.exports = function(grunt) {

    grunt.initConfig({
        clean: {
            dist: ['dist'],
            cleanOther: ['dist/bj-wrap.js']
        },
        uglify: {
            build: {
                files: [{
                    'dist/bj-report.min.js': ["dist/bj-report.js"]
                }, {
                    'dist/bj-report-tryjs.min.js': ["dist/bj-report-tryjs.js"]
                }, ]
            }
        },
        copy: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['**/*.js'],
                    dest: 'dist/'
                }]
            }
        },
        cssmin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['**/*.css'],
                    dest: 'dist/'
                }]
            }
        },
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: ['src/bj-report.js', 'src/bj-wrap.js'],
                dest: 'dist/bj-report-tryjs.js'

            }
        },
        mocha: {
            all: {
                src: 'test/index.html',
                run: false
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: ['Gruntfile.js', 'src/**/*.js']
        }
    });

    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    // alias task
    grunt.registerTask('default', ['dev']);
    grunt.registerTask('dist', ['build']);
    grunt.registerTask('release', ['build']);

    // task
    grunt.registerTask('clear', ['clean']);
    grunt.registerTask('test', ['jshint', 'mocha']);
    grunt.registerTask('dev', ['clean:dev', 'jshint', 'uglify']);
    grunt.registerTask('build', ['clean:dist', 'jshint', 'copy:dist', 'concat:dist', 'clean:cleanOther', 'uglify']);

};
