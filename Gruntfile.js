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
                        cwd: 'src/',
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
    grunt.registerTask('dev', ['clean:dev', 'jshint', 'uglify']);
    grunt.registerTask('build', ['clean', 'jshint',  'uglify', 'copy:dist']);

};
