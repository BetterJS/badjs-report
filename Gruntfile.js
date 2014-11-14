/* global module */
module.exports = function(grunt) {

    grunt.initConfig({
        clean: {
            dev: ['dist'],
            doc: ['doc']
        },
        uglify: {
            build: {
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
        jsdoc: {
            doc: {
                src: ['src/*.js', 'README.md'],
                options: {
                    destination: 'doc/',
                    template: "node_modules/doc-template/template",
                    configure: "node_modules/doc-template/template/jsdoc.conf.json"
                }
            }
        },
        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['**/*.{jpg,jpeg,png,gif,ico,webp}'],
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
            all: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
        }
    });

    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-jsdoc-update');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    // alias task
    grunt.registerTask('default', ['dev']);
    grunt.registerTask('dist', ['build']);
    grunt.registerTask('release', ['build']);

    // task
    grunt.registerTask('clear', ['clean']);
    grunt.registerTask('test', ['jshint', 'mocha']);
    grunt.registerTask('doc', ['clean:doc', 'jsdoc:doc']);
    grunt.registerTask('dev', ['clean:dev', 'jshint', 'uglify']);
    grunt.registerTask('build', ['clean', 'jshint', 'doc', 'uglify', 'copy:dist', 'cssmin:dist']);

};
