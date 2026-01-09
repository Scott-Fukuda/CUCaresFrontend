import './index.scss';
import cover1 from '../../assets/images/cover1.png';
import cover2 from '../../assets/images/cover2.png';
import cover3 from '../../assets/images/cover3.png';
import heartImg from '../../assets/images/heart-img.png';
import grace from '../../../public/team_pic/grace.jpeg';
import scott from '../../../public/team_pic/scott.png';
import lee from '../../../public/team_pic/lee.png';
import salvationArmy from '../../assets/images/salvation-army.jpg';
import secondWind from '../../assets/images/second-wind.jpg';
import childrensGarden from '../../assets/images/childrens-garden.png';
import mobilePack from '../../assets/images/mobile-pack.png';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import profileCheckIcon from '../../assets/icons/profile-check.svg';
import helpIcon from '../../assets/icons/help.svg';
import locationIcon from '../../assets/icons/location.svg';
import searchIcon from '../../assets/icons/search.svg';
import eventDetails from '../../assets/images/event-details.png';
import signUp from '../../assets/images/sign-up.png';
import eventCards from '../../assets/images/event-cards.png';
import tmBlock1 from '../../assets/images/tm-block1.png';
import tmBlock2 from '../../assets/images/tm-block2.png';
import tmBlock3 from '../../assets/images/tm-block3.png';
import tmBlockMB1 from '../../assets/images/tm-block-mb1.png';
import tmBlockMB2 from '../../assets/images/tm-block-mb2.png';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Footer from '../../components/MainFooter';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const HomePage = () => {
    const { isMobile } = useBreakpoint();
    const [isVisible, setIsVisible] = useState(true);
    const covers = [cover1, cover2, cover3];
    const [active, setActive] = useState(0);
    const navigate = useNavigate();
    const [scrollNum, setScrollNum] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);
    const icons = [searchIcon, profileCheckIcon, locationIcon, helpIcon];
    const [maxScrollSteps, setMaxScrollSteps] = useState(0);

    const getCardWidth = () => {
        const container = carouselRef.current;
        if (!container) return 0;

        const card = container.querySelector('.partner') as HTMLElement;
        if (!card) return 0;

        const gap = parseInt(getComputedStyle(container).columnGap || '0', 10);
        return card.offsetWidth + gap;
    };

    const calculateMaxScrollSteps = () => {
        const container = carouselRef.current;
        if (!container) return;

        const cardWidth = getCardWidth();
        if (!cardWidth) return;

        const maxScroll =
            container.scrollWidth - container.clientWidth;

        const steps = Math.round(maxScroll / cardWidth);
        setMaxScrollSteps(Math.max(0, steps));
    };

    const handleScroll = (direction: 'left' | 'right') => {
        const container = carouselRef.current;
        if (!container) return;

        const cardWidth = getCardWidth();
        if (!cardWidth) return;

        const delta = direction === 'left' ? -cardWidth : cardWidth;

        container.scrollBy({
            left: delta,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        const container = carouselRef.current;
        if (!container) return;

        const onScroll = () => {
            const cardWidth = getCardWidth();
            if (!cardWidth) return;

            const index = Math.round(container.scrollLeft / cardWidth);
            setScrollNum(Math.min(index, maxScrollSteps));
        };

        container.addEventListener('scroll', onScroll);
        return () => container.removeEventListener('scroll', onScroll);
    }, [maxScrollSteps]);


    useEffect(() => {
        calculateMaxScrollSteps();

        const handleResize = () => {
            calculateMaxScrollSteps();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);



    const partners = [
        {
            img: salvationArmy,
            tags: ['Food Insecurity'],
            title: 'Salvation Army of Ithaca',
            desc: 'Prepare and serve nourishing meals.'
        },
        {
            img: secondWind,
            tags: ['Housing Insecurity'],
            title: 'Second Wind Cottages',
            desc: 'Renovate homes for formerly homeless neighbors.'
        },
        {
            img: mobilePack,
            tags: ['Food Insecurity', 'Serve Children'],
            title: 'Ithaca Mobile Pack',
            desc: 'Package nutritious meals for children.'
        },
        {
            img: childrensGarden,
            tags: ['Serve Children'],
            title: "Ithaca Children's Garden",
            desc: 'Guide children through an obstacle course.'
        }
    ];

    const tags: Record<string, string> = {
        'Food Insecurity': 'green',
        'Housing Insecurity': 'purple',
        'Serve Children': 'blue'
    };


    useEffect(() => {
        AOS.init({ duration: 1500 });
    }, [])

    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY === 0);
        }

        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const id = setInterval(() => {
            setActive((prev) => (prev + 1) % covers.length);
        }, 7000);

        return () => clearInterval(id);
    }, []);

    return (
        <div className="homepage">
            <div className="main">
                {isMobile &&
                    <div className="main-content mb">
                        <h1>Show Our <br /> Campus Cares</h1>
                        <p>Meet new friends, support local organizations, and help us build a community we can all be proud of.</p>
                        <button className="explore-button" onClick={() => navigate('/login')}>Explore Opportunities</button>
                    </div>
                }
                <div className="bg-slides">
                    {covers.map((src, i) => (
                        <div
                            key={i}
                            className={`slide ${i === active ? 'active' : ''}`}
                            style={{ backgroundImage: `url(${src})` }}
                        />
                    ))}
                </div>
                {!isMobile &&
                    <div className="main-content">
                        <h1>Show Our <br /> Campus Cares</h1>
                        <p>Meet new friends, support local organizations, and help us <br /> build a community we can all be proud of.</p>
                        <button className="explore-button" onClick={() => navigate('/login')}>Explore Opportunities</button>
                        <div className={`below ${isVisible ? '' : 'hidden'}`}>
                            <KeyboardArrowDownIcon style={{ fontSize: '30px' }} />
                        </div>
                    </div>}
            </div>
            <div className="page">
                <div className="header" data-aos='fade'>
                    <h1>IMPACT ROOTED IN COMMUNITY</h1>
                    <p>In just one semester, we’ve hit the ground running, uniting a passionate community of students to step up, give back, and create real impact across Ithaca.</p>
                </div>
                <div className="impact-grid">
                    <div className="top-grid">
                        <div className="grid-container red" data-aos="zoom-in">
                            <div className="red-row">
                                <div className="red-left">
                                    <div className="grid-text" >
                                        <h1>475+</h1>
                                        <p>Total hours contributed</p>
                                    </div>
                                    {!isMobile &&
                                        <button className='request-btn' onClick={() => navigate('/sign-up')}>
                                            <p>Request Volunteers</p>
                                            <ArrowForwardIcon className="arrow-icon" />
                                        </button>}
                                </div>
                                <div>
                                    <img className="heart-img" src={heartImg} alt='Student Working' />
                                </div>
                            </div>
                            {isMobile &&
                                <button className='request-btn' onClick={() => navigate('/sign-up')}>
                                    <p>Request Volunteers</p>
                                    <ArrowForwardIcon className="arrow-icon" />
                                </button>
                            }
                        </div>
                        <div className="grid-container yellow" data-aos="zoom-in">
                            <h1>49</h1>
                            <p>Student organizations represented</p>
                            <div className="users-line">
                                <div className="circle">
                                    <img src={lee} alt='student pfp' />
                                </div>
                                <div className="circle">
                                    <img src={grace} alt='student pfp' />
                                </div>
                                <div className="circle">
                                    <img src={scott} alt='student pfp' />
                                </div>
                                <div className="circle">+350</div>
                            </div>
                        </div>
                    </div>
                    <div className="bot-grid">
                        <div className="grid-container bottom" data-aos="fade">
                            <h1>93</h1>
                            <p>Volunteer Events</p>
                        </div>
                        <div className="grid-container bottom" data-aos="fade">
                            <h1>10</h1>
                            <p>Community partners uplifted</p>
                        </div>
                        <div className="grid-container bottom" data-aos="fade">
                            <h1>350+</h1>
                            <p>Total student volunteers</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="page">
                <div className="header" data-aos="fade">
                    <h1>OUR COMMUNITY PARTNERS</h1>
                    <p>Explore our network of partners and find an organization whose mission resonates with you.</p>
                </div>
                <div className="carousel-container" >
                    <div className="carousel-wrapper">
                        <KeyboardArrowLeftIcon
                            className={`arrow ${scrollNum === 0 ? 'disabled' : ''}`}
                            onClick={() => handleScroll('left')}
                        />

                        <div className="partners" ref={carouselRef}>
                            {partners.map((partner, i) => (
                                <div className="partner" key={i} data-aos="fade-down" data-aos-delay={i * 300}>
                                    <div className="partner-img">
                                        <img src={partner.img} alt={partner.title} />
                                    </div>
                                    <div className="tags">
                                        {partner.tags.map((tag) => (
                                            <div key={tag} className={`tag ${tags[tag]}`}>
                                                {tag}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="sub-title">
                                        <h1>{partner.title}</h1>
                                        <p>{partner.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <KeyboardArrowRightIcon
                            className={`arrow ${scrollNum >= maxScrollSteps ? 'disabled' : ''}`}
                            onClick={() => handleScroll('right')}
                        />
                    </div>

                    <div className="scroll-circles">
                        {Array.from({ length: maxScrollSteps + 1 }).map((_, i) => (
                            <span key={i} className={`scroll-circle ${scrollNum === i ? 'active' : ''}`} />
                        ))}
                    </div>
                </div>
            </div>
            <div className="page extended">
                <div className="header" data-aos="fade">
                    <h1>READY TO MAKE A DIFFERENCE?</h1>
                    <p>Join our community of volunteers and start giving back to the Ithaca community in just four steps.</p>
                </div>
                <div className="timeline">
                    {!isMobile &&
                        <div className="left-timeline">
                            <div className="sub-title mid" data-aos="fade-right">
                                <h1>Find Your Fit</h1>
                                <p>Browse weekly and one-time service events that match your availability and the causes you’re most passionate about.</p>
                                <button className="basic-btn" onClick={() => navigate('/opportunities')} >Browse Events</button>
                            </div>
                            <div className="timeline-block" data-aos="fade-right">
                                <img src={tmBlock2} />
                            </div>
                            <div className="sub-title mid" data-aos="fade-right">
                                <h1>Meet Your Crew</h1>
                                <p>Head to the designated meetup point at the scheduled time. We provide rides for off-campus events.</p>
                            </div>
                            <div className="timeline-block" data-aos="fade-right">
                                <img src={tmBlock3} />
                            </div>
                        </div>}
                    <div className="timeline-line">
                        {icons.map((icon, i) => (
                            <div className="circle-wrap" key={i}>
                                <div className="icon-circle" data-aos="zoom-in">
                                    <img src={icon} />
                                </div>
                                {i != icons.length - 1 &&
                                    <hr />
                                }
                            </div>
                        ))}
                    </div>
                    {isMobile ? (
                        <div className="right-timeline">
                            <div className="timeline-block" data-aos="fade-left">
                                <h1>Find Your Fit</h1>
                                <p>Browse weekly and one-time service events that match your availability and the causes you’re most passionate about.</p>
                                <img src={tmBlock1} />
                            </div>
                            <div className="timeline-block" data-aos="fade-left">
                                <h1>Sign Up</h1>
                                <p>Register for your chosen event based on the specific service needed and see which of your friends are already going.</p>
                                <img src={tmBlockMB1} />
                            </div>
                            <div className="timeline-block" data-aos="fade-left">
                                <h1>Meet Your Crew</h1>
                                <p>Head to the designated meetup point at the scheduled time. We provide rides for off-campus events.</p>
                                <img src={tmBlockMB2} />
                            </div>
                            <div className="timeline-block" data-aos="fade-left">
                                <h1>Serve Your Community</h1>
                                <p>Complete your service, earn points for the organizations you belong to, and climb the service leaderboard.</p>
                                <img src={tmBlock3} />
                            </div>
                        </div>
                    ) : (
                        <div className="right-timeline">
                            <div className="timeline-block" data-aos="fade-left">
                                <img src={tmBlock1} />
                            </div>
                            <div className="sub-title mid" data-aos="fade-left">
                                <h1>Sign Up</h1>
                                <p>Register for your chosen event based on the specific service needed and see which of your friends are already going.</p>
                            </div>
                            <div className="timeline-block" data-aos="fade-left">
                                <img src={tmBlock2} />
                            </div>
                            <div className="sub-title mid" data-aos="fade-left">
                                <h1>Serve Your Community</h1>
                                <p>Complete your service, earn points for the organizations you belong to, and climb the service leaderboard.</p>
                                <button className="basic-btn" onClick={() => navigate('/sign-up')}>Create Account</button>
                            </div>
                        </div>)}
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default HomePage;