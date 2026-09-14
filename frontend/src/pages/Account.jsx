import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE_OUT_EXPO } from '../lib/motion'
import styles from './Account.module.css'

export default function Account() {
  const [activeTab, setActiveTab] = useState('orders')
  const [expandedOrder, setExpandedOrder] = useState('#69769959')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeTab])

  const user = {
    name: "Anzhela\nPozharun",
    avatar: "/media/team01.jpg" // Using an existing avatar image
  }

  const orders = [
    { 
      id: '#69769959', 
      cost: '$123', 
      status: 'Delivered',
      items: [
        { title: "Dr. Andrew Weil\nmushroom serum", qty: 1, price: "$29", img: "/media/shop01.png" },
        { title: "Dr. Andrew Weil\nmushroom serum", qty: 2, price: "$83", img: "/media/shop02.png" }
      ]
    }
  ]

  const panelVariants = {
    enter: { opacity: 0, y: 16 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.layout}>
          
          <aside className={styles.sidebar}>
            <div className={styles.userProfile}>
              <img src={user.avatar} alt="Profile" className={styles.avatar} />
              <div className={styles.userName}>{user.name}</div>
            </div>

            <div className={styles.navMenu}>
              <button 
                className={`${styles.navItem} ${activeTab === 'profile' ? styles.navItemActive : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Personal info
              </button>
              
              <button 
                className={`${styles.navItem} ${activeTab === 'orders' ? styles.navItemActive : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                My orders
              </button>
              
              <button 
                className={`${styles.navItem} ${activeTab === 'requests' ? styles.navItemActive : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                My requests
              </button>
            </div>

            <button className={styles.logoutBtn}>
              <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Log out
            </button>
          </aside>

          <main className={styles.content}>
            <AnimatePresence mode="wait">
              {activeTab === 'orders' && (
                <motion.div 
                  key="orders"
                  variants={panelVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                >
                  <div className={styles.panelHeader}>
                    <h1 className={styles.panelTitle}>My orders</h1>
                  </div>
                  
                  <div className={styles.orderTable}>
                    <div className={styles.tableHeader}>
                      <span>Order Number</span>
                      <span>Cost</span>
                      <span>Order Status</span>
                    </div>

                    <div className={styles.orderList}>
                      {orders.map(order => (
                        <div key={order.id} className={styles.orderRow}>
                          <div 
                            className={`${styles.orderMain} ${expandedOrder === order.id ? styles.expanded : ''}`}
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                          >
                            <span>{order.id}</span>
                            <span>{order.cost}</span>
                            <div className={styles.orderStatusCol}>
                              <div className={styles.statusWrapper}>
                                <div className={styles.statusDot}></div>
                                <span>{order.status}</span>
                              </div>
                              <svg className={styles.chevron} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </div>
                          </div>

                          <AnimatePresence initial={false}>
                            {expandedOrder === order.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div className={styles.orderItems}>
                                  {order.items.map((item, i) => (
                                    <div key={i} className={styles.itemRow}>
                                      <div className={styles.itemInfo}>
                                        <img src={item.img} alt={item.title} className={styles.itemImg} />
                                        <div className={styles.itemTitle}>{item.title}</div>
                                      </div>
                                      <div className={styles.itemQty}>Quantity: {item.qty}</div>
                                      <div className={styles.itemPrice}>Price: {item.price}</div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              
              {activeTab === 'profile' && (
                <motion.div key="profile" variants={panelVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}>
                  <h1 className={styles.panelTitle}>Personal info</h1>
                </motion.div>
              )}

              {activeTab === 'requests' && (
                <motion.div key="requests" variants={panelVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}>
                  <h1 className={styles.panelTitle}>My requests</h1>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
          
        </div>
      </div>
    </div>
  )
}
