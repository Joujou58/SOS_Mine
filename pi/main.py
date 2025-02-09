import asyncio
import threading
import sender
import recieve

def main():
    thread1 = threading.Thread(target=func1)
    thread2 = threading.Thread(target=func2)

    # Start the threads
    thread1.start()
    thread2.start()

    # Wait for both threads to finish
    thread1.join()
    thread2.join()

def func1():
    asyncio.run(sender.main())

def func2():
    recieve.main()
    

if __name__ == "__main__":
    main();
