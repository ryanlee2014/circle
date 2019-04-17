#include <iostream>
#include <unistd.h>
#include <cstdlib>
#include <sys/time.h>
#include <sys/resource.h>
#include <sys/wait.h>
#include <sys/types.h>
#include <sys/errno.h>
#include <pthread.h>
#include <signal.h>

using namespace std;

using ll = long long;
ll time_limit, memory_limit, output_limit, stack_limit;
#define judge_user 6666
#define setLimit(type, value, ext)                                                      \
do {                                                                                    \
    struct rlimit limit;                                                                \
    limit.rlim_cur = (value);                                                           \
    limit.rlim_max = value + ext;                                                       \
    if (setrlimit(type, &limit)) {                                                      \
        errExit("Error in set limit.Arguments: type, value, ext", type, value, ext);    \
    }                                                                                   \
}while(0)

pid_t pid;

enum resultVal {
    WAIT = 0,
    WAIT_REJUDGE = 1,
    COMPILING = 2,
    RUNNING = 3,
    ACCEPT = 4,
    PRESENTATION_ERROR = 5,
    WRONG_ANSWER = 6,
    TIME_LIMIT_EXCEEDED = 7,
    MEMORY_LIMIT_EXCEEDED = 8,
    OUTPUT_LIMIT_EXCEEDED = 9,
    RUNTIME_ERROR = 10,
    COMPILE_ERROR = 11,
    COMPILE_SUCESS = 12,
    TEST_RUN = 13
};

int Exceeded_wall_clock_time;
char* input_sourcefile, *output_sourcefile, *answer_sourcefile, *running_arguments, *checker_sourcefile;

template<class T>
void errExit(T val) {
    cout << val << '\n';
}
template<class T, class... Targs>
void errExit(T val, Targs&&... args) {
    cout << val << " ";
    errExit(forward<Targs>(args)...);
}

inline void goodExit(int result, ll time, ll memory) {
    printf("{\"result\": %d, \"time\": %lld, \"memory\": %lld}", result, time, memory);
    exit(0);
}

void* wait_to_kill_childprocess(void*) {
    sleep(((time_limit + 999) / 1000) << 1);
    kill(pid, 9);
    Exceeded_wall_clock_time = 1;
    return (void *)nullptr;
}

int get_status_code(int x) {
    if (x > 128) x -= 128;
    return x;
}

void init_arguments(int argc, const char** argv) {
    time_limit = atoll(argv[1]);
    memory_limit = atoll(argv[2]);
    output_limit = atoll(argv[3]);
    stack_limit = atoll(argv[4]);
    input_sourcefile = const_cast<char *>(argv[5]);
    output_sourcefile = const_cast<char *>(argv[6]);
    answer_sourcefile = const_cast<char *>(argv[7]);
    running_arguments = const_cast<char *>(argv[8]);
}


int main(int argc, const char** argv) {
    if(argc != 9) {
        errExit("Arguments number must be 9");
    }
    init_arguments(argc, argv);
    if (!freopen("/dev/null", "w", stderr)) {
        errExit("Can not redirect stderr");
    }
    pid = fork();
    if(pid) {
        freopen("out.txt", "w", stdout);
        rusage result;
        int status;
        pthread_t watch_thread;
        if(pthread_create(&watch_thread, nullptr, wait_to_kill_childprocess, nullptr)) {
            errExit("Can not create watch pthread");
        }
        wait4(pid, &status, 0, &result);
        int status_code = get_status_code(WEXITSTATUS(status));
        if(status_code == -1) {
            errExit("System error");
        }
        if(status_code == 127) {
            errExit("Can not run target program(command not found)");
        }

        ll timecost = (ll) result.ru_utime.tv_sec * 1000000ll + (ll)result.ru_utime.tv_sec;
        if(status_code == SIGXCPU || timecost > 1ll * time_limit * 1000 || Exceeded_wall_clock_time) {
            goodExit(TIME_LIMIT_EXCEEDED, timecost / 1000, result.ru_maxrss);
        }
        if(status_code == SIGXFSZ) {
            goodExit(OUTPUT_LIMIT_EXCEEDED, timecost / 1000, result.ru_maxrss);
        }
        if(result.ru_maxrss * 1024 > memory_limit || status_code == SIGIOT) {
            goodExit(MEMORY_LIMIT_EXCEEDED, timecost / 1000, memory_limit);
        }
        if(status_code) {
            goodExit(RUNTIME_ERROR, timecost / 1000, result.ru_maxrss);
        }
        goodExit(ACCEPT, timecost / 1000, result.ru_maxrss);
    }
    else if(pid == 0) {
        if(freopen(input_sourcefile, "r", stdin) == nullptr) {
            errExit("Can not redirect stdin");
        }
        if(freopen(output_sourcefile, "w", stdout) == nullptr) {
            errExit("Can not redirect stdout");
        }
        if(setuid(judge_user)) {
            errExit("Can not set uid");
        }
        setLimit(RLIMIT_CPU, (time_limit + 999) / 1000, 1);
        setLimit(RLIMIT_DATA, memory_limit, 0);
        setLimit(RLIMIT_AS, memory_limit, 0);
        setLimit(RLIMIT_FSIZE, output_limit, 0);
        setLimit(RLIMIT_STACK, stack_limit, 0);
        execl("/bin/sh", "sh", "-c", running_arguments, nullptr);
    }
    else {
        errExit("Can not fork the child process");
    }
}