/* global BigInt */
import React from "react";
import styled from "styled-components";
import {
  querySmallScreen,
  queryVerySmallScreen,
  SCROLLBAR_WIDTH,
  ITEM_HEIGHT,
  WIDTH_TO_SHOW_DOUBLE_HEIGHT,
} from "../../../lib/constants";
import { Etherscan } from "../Icons/Icons";

const EtherscanLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  width: 20px;
  margin-left: 8px;

  &:hover {
    color: var(--etherscan-link-hover-color, #007bff);
  }

  & > div {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      height: 100%;
      width: 100%;
      transition: transform 0.2s ease;
    }
  }

  @media (hover: hover) {
    &:hover svg {
      transform: scale(1.1);
    }
  }
`;

const Wrapper = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  outline: none;

  --text-size: 0.875rem;

  @media ${queryVerySmallScreen} {
    --text-size: 0.75rem;
  }
`;

const List = styled.div`
  height: 100%;
  padding-bottom: 2rem;
`;

const RowWrapper = styled.div`
  display: grid;
  padding: 0.25rem 0;

  grid-template-areas: "index colon AddressAndEtherscan";
  grid-template-rows: 100%;
  grid-template-columns: fit-content(15px) fit-content(15px) 1fr fit-content(
      24px
    );
  gap: 0.25rem 0.5rem;
  align-items: center;

  margin-left: ${SCROLLBAR_WIDTH}px;
  font-family: "Inter", sans-serif;
  white-space: nowrap;
  font-size: var(--text-size);
  border-bottom: 1px solid var(--border-color);
  height: ${ITEM_HEIGHT}px;

  @media (hover: hover) {
    &:hover {
      background-color: var(--slate-400);
    }
  }

  background-color: var(--row-background, transparent);
  transition: background-color 0.1s ease-in-out;

  @media ${querySmallScreen} {
    grid-template-columns: 1fr auto;
    grid-template-areas: "index index" "AddressAndEtherscan AddressAndEtherscan";
    grid-template-rows: 50% 50%;
    height: ${ITEM_HEIGHT * 2}px;
    justify-content: start;
    gap: 0.25rem;
  }
`;

/* Animations removed */

/* Copied text removed */

const Index = styled.span`
  opacity: 0.7;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.95rem;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Padding = styled.span`
  opacity: 0.3;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.95rem;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const IndexWithPadding = styled.div`
  display: inline-block;
`;

const Colon = styled.span`
  grid-area: colon;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.95rem;

  &::after {
    content: ":";
  }

  @media ${querySmallScreen} {
    display: none;
  }
`;

const AddressAndEtherscan = styled.span`
  grid-area: AddressAndEtherscan;
  display: flex;
  align-items: center;
`;

const Address = styled.span`
  color: var(--address-color);
  display: block;
  width: fit-content;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.95rem;
  letter-spacing: 0;
  font-weight: 500;
  max-width: 100%;

  @media ${querySmallScreen} {
    justify-self: start;
  }
`;

const Highlight = styled.span`
  background-color: var(--yellow-300);
  border-radius: 2px;
  padding: 0 2px;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.95rem;
`;

function truncate(address) {
  if (!address) return address;
  if (typeof window !== "undefined" && window.innerWidth > 768) {
    return address;
  }
  // For ETH addresses, always show first 6 and last 4
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatIndex(indexString) {
  if (
    typeof window !== "undefined" &&
    window.innerWidth <= 768 &&
    indexString.length > 8
  ) {
    return `${indexString.slice(0, 4)}…${indexString.slice(-4)}`;
  }
  return indexString;
}

function Row({ index, address, search, searchDisplayed }) {
  const indexString = index.toString();
  const length = indexString.length;
  const padLength = 49;
  let padding = "";
  if (typeof window !== "undefined" && window.innerWidth > 768) {
    const paddingLength = padLength - length;
    if (paddingLength < 0) {
      console.error("paddingLength < 0", indexString, length, padLength);
      padding = "";
    } else {
      padding = "0".repeat(paddingLength);
    }
  }

  const highlight =
    searchDisplayed &&
    search &&
    address.toLowerCase().includes(search.toLowerCase());
  let addressToDisplay = address;
  if (highlight) {
    const searchLower = search.toLowerCase();
    const addressLower = address.toLowerCase();
    const start = addressLower.indexOf(searchLower);
    const end = start + search.length;
    addressToDisplay = (
      <>
        {truncate(address.slice(0, start))}
        <Highlight>{truncate(address.slice(start, end))}</Highlight>
        {truncate(address.slice(end))}
      </>
    );
  } else {
    addressToDisplay = truncate(address);
  }

  const formattedIndex = formatIndex(indexString);

  return (
    <RowWrapper>
      <IndexWithPadding style={{ gridArea: "index" }}>
        <Padding>{padding}</Padding>
        <Index>{formattedIndex}</Index>
      </IndexWithPadding>
      <Colon />
      <AddressAndEtherscan>
        <Address>{addressToDisplay}</Address>
        <EtherscanLink
          href={`https://etherscan.io/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          title="View on Etherscan"
        >
          <Etherscan />
        </EtherscanLink>
      </AddressAndEtherscan>
    </RowWrapper>
  );
}

function ETHDisplay({
  itemsToShow,
  setItemsToShow,
  virtualPosition,
  setVirtualPosition,
  isAnimating,
  MAX_POSITION,
  animateToPosition,
  search,
  searchDisplayed,
  displayedAddresses,
}) {
  const ref = React.useRef(null);

  const movePosition = React.useCallback(
    (delta) => {
      if (isAnimating) return;
      setVirtualPosition((prev) => {
        const newPos = prev + delta;
        const ret =
          newPos < 0n ? 0n : newPos > MAX_POSITION ? MAX_POSITION : newPos;
        return ret;
      });
    },
    [isAnimating, MAX_POSITION, setVirtualPosition]
  );

  React.useEffect(() => {
    if (ref.current === null) return;

    const computeItemsToShow = () => {
      const rect = ref.current.getBoundingClientRect();
      const height = rect.height;
      const width = rect.width + SCROLLBAR_WIDTH;
      const showDoubleHeight = width < WIDTH_TO_SHOW_DOUBLE_HEIGHT;
      const items = Math.floor(
        height / (showDoubleHeight ? ITEM_HEIGHT * 2 : ITEM_HEIGHT)
      );
      setItemsToShow(items);
    };
    computeItemsToShow();

    window.addEventListener("resize", computeItemsToShow);
    return () => {
      window.removeEventListener("resize", computeItemsToShow);
    };
  }, [setItemsToShow]);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, []);

  React.useEffect(() => {
    if (!ref.current) return;
    const handleWheel = (e) => {
      if (isAnimating) return;
      e.preventDefault();
      movePosition(BigInt(Math.floor(e.deltaY)));
    };
    ref.current.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    let lastTouchY = 0;
    let lastTouchTime = 0;
    let velocity = 0;
    let animationFrame = null;

    const applyMomentum = () => {
      if (Math.abs(velocity) > 0.5) {
        movePosition(BigInt(Math.floor(velocity)));
        velocity *= 0.95;
        animationFrame = requestAnimationFrame(applyMomentum);
      } else {
        velocity = 0;
      }
    };

    const handleTouchStart = (e) => {
      lastTouchY = e.touches[0].clientY;
      lastTouchTime = Date.now();
      velocity = 0;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touchY = e.touches[0].clientY;
      const deltaY = lastTouchY - touchY;
      const now = Date.now();
      const deltaTime = now - lastTouchTime;

      velocity = (deltaY / deltaTime) * 16.67;

      lastTouchY = touchY;
      lastTouchTime = now;

      movePosition(BigInt(Math.floor(deltaY * 2)));
    };

    const handleTouchEnd = () => {
      if (Math.abs(velocity) > 0.5) {
        animationFrame = requestAnimationFrame(applyMomentum);
      }
    };

    ref.current.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    ref.current.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    ref.current.addEventListener("touchend", handleTouchEnd, {
      passive: false,
    });

    return () => {
      if (!ref.current) return;
      ref.current.removeEventListener("wheel", handleWheel);
      ref.current.removeEventListener("touchstart", handleTouchStart);
      ref.current.removeEventListener("touchmove", handleTouchMove);
      ref.current.removeEventListener("touchend", handleTouchEnd);
    };
  }, [movePosition]);

  const handleKeyDown = React.useCallback(
    (e) => {
      if (isAnimating) return;
      const PAGE_SIZE = BigInt(itemsToShow);
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;
      const shiftKey = e.shiftKey;

      const handleAndPrevent = (action) => {
        e.preventDefault();
        action();
      };

      const hasKeyAndModifier = (key, modifiers = []) => {
        return e.key === key && modifiers.every((mod) => mod);
      };

      const handleKeyAndPrevent = (key, modifiers = [], action) => {
        if (hasKeyAndModifier(key, modifiers)) {
          handleAndPrevent(action);
          return true;
        }
        return false;
      };

      const animateWithDelta = (delta) => {
        let target = virtualPosition + delta;
        if (target < 0n) {
          target = 0n;
        } else if (target > MAX_POSITION) {
          target = MAX_POSITION;
        }
        animateToPosition(target);
      };

      switch (true) {
        case handleKeyAndPrevent("ArrowDown", [cmdKey], () => {
          animateWithDelta(MAX_POSITION);
        }):
          return;
        case handleKeyAndPrevent("ArrowUp", [cmdKey], () =>
          animateWithDelta(-MAX_POSITION)
        ):
          return;
        case handleKeyAndPrevent(" ", [shiftKey], () => {
          animateWithDelta(-PAGE_SIZE);
        }):
          return;
        case handleKeyAndPrevent(" ", [], () => {
          animateWithDelta(PAGE_SIZE);
        }):
          return;
        case handleKeyAndPrevent("PageDown", [cmdKey], () => {
          animateWithDelta(MAX_POSITION);
        }):
          return;
        case handleKeyAndPrevent("PageUp", [cmdKey], () => {
          animateWithDelta(0n);
        }):
          return;
        case handleKeyAndPrevent("PageDown", [], () => {
          animateWithDelta(PAGE_SIZE);
        }):
          return;
        case handleKeyAndPrevent("PageUp", [], () => {
          animateWithDelta(-PAGE_SIZE);
        }):
          return;
        case handleKeyAndPrevent("Home", [], () => animateWithDelta(0n)):
          return;
        case handleKeyAndPrevent("End", [], () =>
          animateWithDelta(MAX_POSITION)
        ):
          return;
        case handleKeyAndPrevent("ArrowDown", [], () => movePosition(1n)):
          return;
        case handleKeyAndPrevent("ArrowUp", [], () => movePosition(-1n)):
          return;
        case handleKeyAndPrevent("j", [], () => movePosition(1n)):
          return;
        case handleKeyAndPrevent("k", [], () => movePosition(-1n)):
          return;
        default:
          break;
      }
    },
    [
      isAnimating,
      virtualPosition,
      movePosition,
      MAX_POSITION,
      itemsToShow,
      animateToPosition,
    ]
  );

  return (
    <Wrapper ref={ref} onKeyDown={handleKeyDown} tabIndex={0}>
      <List>
        {displayedAddresses.map(({ index, address }) => {
          return (
            <Row
              key={address}
              index={index}
              address={address}
              search={search}
              searchDisplayed={searchDisplayed}
            />
          );
        })}
      </List>
    </Wrapper>
  );
}

export default ETHDisplay;
