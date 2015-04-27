/* global module */
module.exports = function(grunt) {

    grunt.initConfig({
        clean: {
            dev: ['dist']
        },
        uglify: {
            build: {
                files: [
                    {
                        expand: true,
                        cwd: 'dist/',
                        src: ['**/*.js'],
                        dest: 'dist/'
                    }
                ]
            }
        },
        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['**/*.js'],
                        dest: 'dist/'
                    }
                ]
            }
        },
        cssmin: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['**/*.css'],
                        dest: 'dist/'
                    }
                ]
            }
        },
        concat : {
            options: {
                separator: ';'
            },
            dist : {
                src: ['src/bj-report.js' , 'src/bj-wrap.js' , 'src/bj-module.js'],
                dest: 'dist/bj-reportWrap.js'

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
    grunt.registerTask('build', ['clean', 'jshint', 'copy:dist' ,   'concat:dist'  , 'uglify' ]);

};
