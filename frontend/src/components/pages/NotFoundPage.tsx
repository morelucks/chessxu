import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className='min-h-screen bg-slate-950 flex items-center justify-center p-4'>
      {/* Container with premium glassmorphism */}
      <div className='w-full max-w-4xl flex-col justify-start items-center lg:gap-16 gap-10 inline-flex'>
        <div className='bg-white/5 backdrop-blur-xl border border-white/10 h-auto min-h-[550px] rounded-2xl w-full shadow-2xl overflow-hidden'>
          {/* Header Bar */}
          <div className='p-8 flex justify-between items-center border-b border-white/5 bg-white/5'>
            <div className='block opacity-80'>
              <svg
                width='204'
                height='18'
                viewBox='0 0 204 18'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <circle
                  cx='8.78677'
                  cy='8.78677'
                  r='8.78677'
                  transform='matrix(1 0 0 -1 0 17.6912)'
                  fill='#312e81'
                />
                <circle
                  cx='8.78677'
                  cy='8.78677'
                  r='8.78677'
                  transform='matrix(1 0 0 -1 28.1177 17.6912)'
                  fill='#4f46e5'
                />
                <circle
                  cx='8.78677'
                  cy='8.78677'
                  r='8.78677'
                  transform='matrix(1 0 0 -1 56.2353 17.6912)'
                  fill='#312e81'
                />
                <path
                  d='M91.3824 8.9044C91.3824 13.7572 95.3164 17.6912 100.169 17.6912H195.066C199.919 17.6912 203.853 13.7572 203.853 8.9044C203.853 4.0516 199.919 0.117632 195.066 0.117632H100.169C95.3163 0.117632 91.3824 4.0516 91.3824 8.9044Z'
                  fill='#1e1b4b'
                />
              </svg>
            </div>
            <div className='block'>
              <svg
                width='18'
                height='18'
                viewBox='0 0 18 18'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <circle
                  cx='8.78677'
                  cy='8.78677'
                  r='8.78677'
                  transform='matrix(1 0 0 -1 0 17.6912)'
                  fill='#ef4444'
                  fillOpacity='0.6'
                />
              </svg>
            </div>
          </div>

          {/* Main Content Area */}
          <div className='relative h-full min-h-[465px] flex justify-center items-center flex-col px-6 py-12'>
            
            <div className='relative group'>
              {/* Subtle Glow Effect behind the SVG */}
              <div className='absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-500' />

              <svg
                width='314'
                height='171'
                viewBox='0 0 314 171'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                className='relative z-10 scale-110'
              >
                <path
                  d='M131.408 134.14L131.407 134.139C124.251 129.827 118.724 123.793 114.83 116.051L114.829 116.049C110.981 108.307 109.065 99.3201 109.065 89.1025C109.065 78.885 110.981 69.8983 114.829 62.156L114.83 62.1539C118.724 54.4117 124.251 48.3783 131.407 44.0663L131.408 44.0655C138.616 39.75 147.163 37.6025 157.029 37.6025C166.894 37.6025 175.419 39.7498 182.582 44.0659C189.784 48.3778 195.311 54.4115 199.16 62.1549C203.054 69.8975 204.993 78.8846 204.993 89.1025C204.993 99.3208 203.054 108.308 199.16 116.051C199.16 116.051 199.159 116.051 199.159 116.051L198.713 115.827C194.905 123.488 189.442 129.449 182.325 133.711L131.408 134.14ZM131.408 134.14C138.616 138.455 147.163 140.603 157.029 140.603C166.894 140.603 175.419 138.455 182.582 134.139L131.408 134.14ZM43.4542 138.063V138.563H43.9542H62.7222H63.2222V138.063V123.331H71.4262H71.9262V122.831V105.559V105.059H71.4262H63.2222V81.0785V80.5785H62.7222H43.9542H43.4542V81.0785V105.059H23.3911L53.9264 40.3559L54.2631 39.6425H53.4742H32.2582H31.9413L31.8061 39.9291L0.934056 105.345L0.88623 105.446V105.559V122.831V123.331H1.38623H43.4542V138.063ZM181.318 106.729L181.317 106.732C179.31 111.726 176.288 115.563 172.254 118.267C168.232 120.963 163.171 122.284 157.036 122.195C150.898 122.105 145.83 120.695 141.803 117.995C137.767 115.29 134.722 111.495 132.671 106.591C130.661 101.678 129.649 95.853 129.649 89.1025C129.649 82.3519 130.661 76.4793 132.672 71.4739C134.724 66.4795 137.769 62.6418 141.803 59.9379C145.825 57.2419 150.887 55.9209 157.021 56.0105C163.16 56.1001 168.227 57.5104 172.254 60.2099C176.29 62.9151 179.312 66.709 181.318 71.6119L181.319 71.6154C183.374 76.5274 184.409 82.3523 184.409 89.1025C184.409 95.8524 183.374 101.724 181.318 106.729ZM284.642 138.063V138.563H285.142H303.91H304.41V138.063V123.331H312.614H313.114V122.831V105.559V105.059H312.614H304.41V81.0785V80.5785H303.91H285.142H284.642V81.0785V105.059H264.579L295.114 40.3559L295.451 39.6425H294.662H273.446H273.129L272.994 39.9291L242.122 105.345L242.074 105.446V105.559V122.831V123.331H242.574H284.642V138.063Z'
                  fill='#0f172a'
                  stroke='#6366f1'
                  strokeWidth='2'
                />
                <path
                  d='M176.88 0.632498V142.715C97.4004 142.715 216.007 142.715 216.007 142.715V38.9309C216.007 38.0244 176.88 0.632498 176.88 0.632498Z'
                  fill='#1e293b'
                  stroke='#334155'
                />
                <ellipse
                  cx='160.123'
                  cy='81'
                  rx='28.0342'
                  ry='28.0342'
                  fill='#312e81'
                />
                <circle
                  cx='211'
                  cy='130'
                  r='15'
                  fill='#4f46e5'
                  fillOpacity='0.4'
                />
              </svg>
            </div>
            <div className='block text-center mt-8'>
              <h1 className='md:text-3xl text-2xl leading-tight text-slate-100 font-bold mb-4 tracking-tight'>
                <span className='text-indigo-400'>Oops!</span> That move was
                invalid.
              </h1>
              <p className='text-base text-slate-400 max-w-md mx-auto mb-8 font-medium'>
                The page you're looking for has been captured or never joined
                the board.
              </p>

              {/* Return Home Button */}
              <Link
                to='/'
                className='inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95'
              >
                <Home size={18} />
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
